# AGAP Java Backend

Spring Boot REST API for the AGAP hazard-reporting application. The backend uses
Java 17+ and Spring Data JPA. It uses a local H2 file database by default and can
connect to Supabase PostgreSQL for shared report storage.

## Run

Install Java 17+ and Maven, then from this directory run:

```powershell
$env:AGAP_SUPABASE_URL = "https://<project-ref>.supabase.co"
$env:AGAP_SUPABASE_ANON_KEY = "<publishable-or-anon-key>"
mvn spring-boot:run
```

The API starts at `http://localhost:8080`; report data is stored in
`data/agap.mv.db`. Run backend tests with `mvn test`.

## Use Supabase PostgreSQL

The Java API writes reports to the existing Supabase `public.reports` table when
configured with a PostgreSQL connection. In the Supabase dashboard, open
**Connect** and select **Transaction pooler** for Vercel's serverless-style
runtime. Use the exact pooler host, port, and username Supabase displays.
Configure these as private environment variables on the backend host (not in
the React app):

| Variable | Value |
|---|---|
| `AGAP_DATABASE_URL` | `jdbc:postgresql://<pooler-host>:<port>/<database>?sslmode=require&prepareThreshold=0` using the Transaction pooler values shown by Supabase |
| `AGAP_DATABASE_USERNAME` | Database user from the Supabase connection details |
| `AGAP_DATABASE_PASSWORD` | Database password from Supabase |
| `AGAP_JPA_DDL_AUTO` | `none` after confirming the table schema below |

The existing `reports` table should contain `id`, `ticket_no`, `device_id`,
`category`, `hazard_type`, `severity`, `location`, `coordinates`, `description`,
`status`, `proof_photos`, `photos`, `notice_text`, and `created_at`. The security
migration also adds an `auth_user_id` UUID column. If
`notice_text` is missing, add it from the Supabase SQL Editor before deployment:

```sql
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS notice_text text;
```

Keep schema auto-update disabled in production to avoid unintended schema
changes. The application uses a small connection pool by default; adjust
`AGAP_DB_POOL_SIZE` only if needed. Never put the database password or a
service-role key in the frontend.

## Supabase authentication and RLS

Before deploying the secured API:

1. Back up the database, then run [`supabase/rls-and-admins.sql`](./supabase/rls-and-admins.sql)
   in the Supabase SQL Editor. It enables RLS, replaces existing policies on
   `profiles` and `reports`, creates the API's `banned_devices` table, removes
   direct client access to reports, and limits profile access to its
   authenticated owner or an admin. It is safe to rerun to add the missing
   table; existing device bans are retained.
   Existing profiles are intentionally left unlinked; do not assign ownership
   using `device_id`, which is client-controlled.
2. In Supabase **Authentication > Providers**, enable **Anonymous Sign-Ins**.
   Enable Email sign-in for administrators and create each administrator account
   through Supabase Auth.
3. Promote an administrator from the SQL Editor using that account's Auth UUID:

   ```sql
   INSERT INTO public.admin_users (user_id)
   VALUES ('<administrator-auth-user-uuid>');
   ```

   Remove admin access by deleting that row. Never expose a database password
   or Supabase service-role key in the browser.
   To restore a legacy profile, first verify its owner outside the app, then link
   the profile by its database `id` (not by device ID):

   ```sql
   UPDATE public.profiles
   SET auth_user_id = '<verified-auth-user-uuid>'
   WHERE id = '<verified-profile-id>' AND auth_user_id IS NULL;
   ```
4. Configure the backend's private environment variables:

   | Variable | Value |
   |---|---|
   | `AGAP_SUPABASE_URL` | Supabase project URL, e.g. `https://<project-ref>.supabase.co` |
   | `AGAP_SUPABASE_ANON_KEY` | Supabase publishable/anon key |
   | `AGAP_CORS_ALLOWED_ORIGINS` | Comma-separated frontend origins, or `*` for any origin |

   The Java API checks bearer tokens against Supabase Auth and checks admin
   membership on every request. `/api/admin/**` requires an `admin_users` entry.
   Report submission and personal report history require a Supabase session;
   the public report feed is limited to approved reports.
5. In the React/Vercel project, enable anonymous authentication and make sure
   `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY` are set. The admin
   portal uses email/password authentication in a separate browser session from
   the guest session.

The frontend uses `http://localhost:8080/api` by default. Set
`REACT_APP_API_BASE_URL` in the frontend environment when the API is hosted at a
different address (for example, when testing on a physical phone).

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/reports` | Submit a hazard report |
| `GET` | `/api/reports` | List the signed-in user's reports; `status=APPROVED` returns the public feed |
| `GET` | `/api/admin/reports` | List reports for the admin screen |
| `GET` | `/api/admin/session` | Verify an authenticated admin session |
| `PUT` | `/api/admin/reports/{id}/status` | Change report status and optional notice |
| `DELETE` | `/api/admin/reports/rejected` | Permanently delete rejected/deleted reports |
| `POST` | `/api/admin/devices/{deviceId}/ban` | Ban a device from submitting reports |
| `POST` | `/api/auth/send-otp` | Returns `501` until an SMS provider is configured |

JSON request/response field names use `snake_case` to match the current frontend.
SMS delivery is not implemented.

The backend database connection currently uses the configured database role,
which may bypass PostgreSQL RLS if it is the Supabase table owner. Therefore
the Java API's token validation, ownership filtering, and admin authorization
are required as well; keep database credentials private and do not expose the
backend's database role to the React app.
