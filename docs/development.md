# Local development

> Local development resumed November 15, 2026. The map/list discovery foundation and fictional stand-detail reference are implemented; the expanded [MVP](mvp.md) is still in progress. Required fields and USD-only responses remain reference-model limitations.

## Map and destination search configuration

For the public static sample, use `npm run build:sample --prefix apps/web` and `npm run test:sample --prefix apps/web`; see [deployment](deployment.md). These commands use bundled fictional data and do not need the API. Normal development continues to use the API below. The sample build requires a Geoapify browser key at build time.

Copy `apps/web/.env.example` to `apps/web/.env.local` and set `VITE_GEOAPIFY_API_KEY` to a Geoapify browser key. Restart Vite after changing it. The key is visible to visitors: restrict allowed origins in the Geoapify dashboard, including the local preview origin when developing. Never put private server credentials in VITE variables. `.env.local` is ignored by Git.

The root page now opens discovery. Without a key, map/search explains its configuration state and list discovery remains available. Searches run only on submission, go directly to Geoapify and offer up to five destination choices. Use my location is the only implemented action requesting location; nothing requests permission on launch. Geoapify tiles/search require a connection. There is no offline map support.

`GET /api/stands?latitude=43.68&longitude=-70.44&radiusMiles=10` returns nearest-first public reference stands and straight-line mile distances. Radius defaults to 10 miles, with a technical maximum of 100; at most 200 items are returned with a truncation flag. SQL Server geography computes distances in meters. No schema migration is needed for this slice. The development seed includes seven fictional Southern Maine stands inside the initial radius and two farther north toward Raymond/Casco; widening to 25 miles includes those too. Close pairs exercise clustering, and samples mix priced/unknown facts and seasonal/active status. Seasonal dates remain unimplemented. The original Conway reference at (43.98, -71.12) is unchanged.

## Prerequisites

- .NET 10 SDK.
- Node.js LTS. This machine was upgraded from 18.17.0 to 26.13.0 using the official Windows installer through winget. Restart existing terminals to pick up changes. Dependencies are pinned and `package-lock.json` is included.
- SQL Server LocalDB (already installed here), or a SQL Server instance you can create a development database on.

## First-time setup

From repository root:

```powershell
dotnet tool restore
dotnet restore apps/api
npm ci --prefix apps/web
dotnet user-secrets set 'ConnectionStrings:Woodstop' 'Server=(localdb)\MSSQLLocalDB;Database=WoodstopDevelopment;Integrated Security=true;Encrypt=true;TrustServerCertificate=true' --project apps/api
$env:ASPNETCORE_ENVIRONMENT = 'Development'
dotnet ef database update --project apps/api
dotnet run --project apps/api -- --seed-demo
```

Configure the local connection through user-secrets as shown above; do not assume a new terminal/session loads an earlier machine setting. Alternatively, set `ConnectionStrings__Woodstop` in the API process environment to the same local connection string. No credentials are committed. TrustServerCertificate is for this local instance only. A hosted database needs properly validated TLS and its own settings.

On November 15 the existing `WoodstopDevelopment.mdf` and log files were present but detached from LocalDB. They were reattached without replacing data or applying a new migration. If this recurs, inspect the instance and existing files before creating a replacement database.

Migrations are explicit; API startup never creates or migrates databases. Review `docs/initial-migration.sql` for the initial schema. The `--seed-demo` command works only in Development and inserts any missing members of the ten stable-ID fictional records (the original Conway stand plus nine Maine samples). Rerunning does not duplicate records or overwrite local edits, including visibility changes. All samples have `IsDemo = true`, demo names, and fictional-data notices; their pins are not advertised sellers or verified sale locations. Do not seed a real deployment.

## Run locally

Terminal 1, repository root:

```powershell
$env:ASPNETCORE_ENVIRONMENT = 'Development'
dotnet run --project apps/api --urls http://localhost:5080
```

Terminal 2, repository root:

```powershell
npm run dev --prefix apps/web -- --port 5173 --strictPort
```

Open `http://127.0.0.1:5173/stands/11111111-1111-4111-8111-111111111111`. Vite proxies `/api` and `/health` to port 5080. Browser deep-link refresh works in Vite; production hosting/SPA fallback is still a later slice. Stop each process with Ctrl+C.

`GET /health` checks the process, not database readiness. `GET /api/stands/{id}` returns the public detail DTO, with 404 for draft, hidden, closed or missing stands. No write endpoints are exposed. Internal source notes are not returned. Stock is unknown because no stock reporting feature exists yet.

## Verification

```powershell
dotnet build apps/api
dotnet test tests/api
npm run build --prefix apps/web
npm exec --prefix apps/web -- playwright install chromium
npm test --prefix apps/web
```

API tests use real SQL Server LocalDB with a unique `WoodstopTests_<guid>` database per test, apply migrations, seed fixtures, and remove only that test database at the end. They check visibility, null/dated data, coordinates, private-field exclusion, and geography meter units. No in-memory database substitute is used.

Browser tests require the seeded API running on port 5080. They start Vite automatically and run in Chromium at desktop and emulated iPhone dimensions, checking real API reads/directions, unknown fields, loading/retry, missing listings, and horizontal overflow. Phone emulation does not replace testing on a physical phone. Screenshots go into `apps/web/test-results/` when run through npm; test artifacts are ignored.

### Verification run: November 15, 2026

- API build passed; 18 SQL Server integration tests passed, including nearby radius/default-distance checks, input validation and nonpublic exclusion.
- Web production build passed. MapLibre and its worker are bundled separately; the build retains a large-map-chunk warning. Stand-detail/list code does not need to load the map bundle until rendering the map.
- All 18 desktop/mobile browser checks passed. Discovery checks cover initial center/radius, explicit location permission, denied location, radius widening, request retry, destination selection and provider failure. Discovery map/search responses use a fake test key and intercepted Geoapify fixtures, so tests do not consume provider credits. Stand-detail checks still read the real local API/database.
- Inspected desktop/mobile discovery screenshots. The fixture intentionally has a plain map background, not real geographic tiles. Live Geoapify tile/search quality, credits, and real-device testing remain unverified until a real key is configured.
- Tests launch their own Vite instance; stop any manual preview occupying port 5173 before running them.

## Current limits

This is a discovery foundation plus stand-detail reference: no real stand data, curated destination anchors, confirmation/season filters, seasonal date calculations, Share action, Save a stand/local drafts, public submissions, photos, authentication, deployment or offline behavior yet. Do not confuse this slice with the completed map-discovery gate or full MVP. Geoapify destination quality/credit usage still need live evaluation with a configured key. Map guidance is general copy, with no live regulatory assertions.

The direct System.Security.Cryptography.Pkcs package reference upgrades a transitive dependency flagged by NuGet's advisory check. Reassess the override when upgrading the EF toolchain. Keep framework packages on compatible servicing releases.

