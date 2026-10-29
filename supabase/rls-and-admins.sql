-- Run in the Supabase SQL Editor after backing up the project.
-- Existing profiles remain unclaimed until an administrator securely links
-- them to Supabase Auth users.

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS username text,
    ADD COLUMN IF NOT EXISTS full_name text,
    ADD COLUMN IF NOT EXISTS phone_number text,
    ADD COLUMN IF NOT EXISTS barangay text,
    ADD COLUMN IF NOT EXISTS device_id text,
    ADD COLUMN IF NOT EXISTS user_role text NOT NULL DEFAULT 'GUEST',
    ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'GUEST',
    ADD COLUMN IF NOT EXISTS id_proof_photo text;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_auth_user_id_key
    ON public.profiles (auth_user_id)
    WHERE auth_user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.banned_devices (
    device_id text PRIMARY KEY,
    banned_at timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON TABLE public.admin_users FROM anon, authenticated;
REVOKE ALL ON TABLE public.admin_users FROM PUBLIC;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.banned_devices FROM anon, authenticated, PUBLIC;
ALTER TABLE public.banned_devices ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_agap_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.admin_users
        WHERE user_id = (SELECT auth.uid())
    );
$$;

REVOKE ALL ON FUNCTION public.is_agap_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_agap_admin() TO authenticated;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports
    ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL;

DO $$
DECLARE
    existing_policy record;
BEGIN
    FOR existing_policy IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN ('profiles', 'reports')
    LOOP
        EXECUTE format(
            'DROP POLICY %I ON %I.%I',
            existing_policy.policyname,
            existing_policy.schemaname,
            existing_policy.tablename
        );
    END LOOP;
END;
$$;

CREATE POLICY profiles_select_owner_or_admin
    ON public.profiles FOR SELECT TO authenticated
    USING (auth_user_id = (SELECT auth.uid()) OR (SELECT public.is_agap_admin()));

CREATE POLICY profiles_insert_owner
    ON public.profiles FOR INSERT TO authenticated
    WITH CHECK (
        auth_user_id = (SELECT auth.uid())
        AND user_role = 'GUEST'
        AND verification_status IN ('GUEST', 'PENDING')
    );

CREATE POLICY profiles_update_owner_or_admin
    ON public.profiles FOR UPDATE TO authenticated
    USING (auth_user_id = (SELECT auth.uid()) OR (SELECT public.is_agap_admin()))
    WITH CHECK (
        (auth_user_id = (SELECT auth.uid())
            AND user_role = 'GUEST'
            AND verification_status IN ('GUEST', 'PENDING'))
        OR (SELECT public.is_agap_admin())
    );

-- Frontend users must not access reports directly. The Java API authenticates
-- Supabase access tokens and applies owner/admin checks before database access.
REVOKE ALL ON TABLE public.reports FROM anon, authenticated;
REVOKE ALL ON TABLE public.profiles FROM anon, authenticated;
REVOKE ALL ON TABLE public.reports FROM PUBLIC;
REVOKE ALL ON TABLE public.profiles FROM PUBLIC;
GRANT SELECT, INSERT ON TABLE public.profiles TO authenticated;
GRANT UPDATE (username, full_name, phone_number, barangay, id_proof_photo)
    ON TABLE public.profiles TO authenticated;
GRANT UPDATE (verification_status)
    ON TABLE public.profiles TO authenticated;

-- Grant admin access only from the trusted SQL Editor after creating the
-- administrator's Supabase Auth account. Replace the UUID in a separate
-- statement; never grant admin from client-side code.
