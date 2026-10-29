# AGAP Java Backend

Spring Boot REST API for the AGAP hazard-reporting application. The backend uses
Java 17+, Spring Data JPA, and a local H2 file database by default.

## Run

Install Java 17+ and Maven, then from this directory run:

```powershell
mvn spring-boot:run
```

The API starts at `http://localhost:8080`; report data is stored in
`data/agap.mv.db`. Run backend tests with `mvn test`.

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
