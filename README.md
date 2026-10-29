# AGAP Java Backend

Spring Boot REST API for the AGAP hazard-reporting application. The backend uses
Java 17+ and Spring Data JPA. It uses a local H2 file database by default and can
connect to Supabase PostgreSQL for shared report storage.

## Run

Install Java 17+ and Maven, then from this directory run:

```powershell
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
`status`, `proof_photos`, `photos`, `notice_text`, and `created_at`. If
`notice_text` is missing, add it from the Supabase SQL Editor before deployment:

```sql
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS notice_text text;
```

Keep schema auto-update disabled in production to avoid unintended schema
changes. The application uses a small connection pool by default; adjust
`AGAP_DB_POOL_SIZE` only if needed. Never put the database password or a
service-role key in the frontend.

The frontend uses `http://localhost:8080/api` by default. Set
`REACT_APP_API_BASE_URL` in the frontend environment when the API is hosted at a
different address (for example, when testing on a physical phone).

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/reports` | Submit a hazard report |
| `GET` | `/api/reports` | List reports; optionally filter with `deviceId` and/or `status` |
| `GET` | `/api/admin/reports` | List reports for the admin screen |
| `PUT` | `/api/admin/reports/{id}/status` | Change report status and optional notice |
| `DELETE` | `/api/admin/reports/rejected` | Permanently delete rejected/deleted reports |
| `POST` | `/api/admin/devices/{deviceId}/ban` | Ban a device from submitting reports |
| `POST` | `/api/auth/send-otp` | Returns `501` until an SMS provider is configured |

JSON request/response field names use `snake_case` to match the current frontend.
The API currently runs as a local/demo backend: admin routes are not protected by
authentication. Do not expose it to a public network until admin authentication
and authorization have been added. SMS delivery is not implemented.

User profiles and profile verification remain in the existing Supabase setup.
