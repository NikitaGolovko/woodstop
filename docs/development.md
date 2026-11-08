# Local development

> Development is paused. This document describes the existing demo only; the expanded agreed MVP in [mvp.md](mvp.md) is not implemented. In particular, the current required fields and USD-only response are demo limitations, not the new submission requirements.

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

The local connection is already configured on this machine through user-secrets; no credentials are committed. TrustServerCertificate is for this local instance only. A hosted database needs properly validated TLS and its own settings.

Migrations are explicit; API startup never creates or migrates databases. Review `docs/initial-migration.sql` for the initial schema. The demo command works only in Development and adds one stable-ID fictional record; rerunning does not overwrite data. Do not seed a real deployment.

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

## Current limits

This is the stand-detail slice: no nearby search/map, real stand data, public submissions, photos, authentication, deployment, or offline behavior yet. The root page links to the fictional detail preview. Map guidance is general copy, with no live regulatory assertions.

The direct System.Security.Cryptography.Pkcs package reference upgrades a transitive dependency flagged by NuGet's advisory check. Reassess the override when upgrading the EF toolchain. Keep framework packages on compatible servicing releases.

