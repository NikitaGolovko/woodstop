# Public sample deployment

Prepared November 15, 2026 at the founder's request. Initial target: Cloudflare Pages connected to GitHub, serving a public, read-only sample. No Azure resources, cloud database or backend rewrite is needed for this preview. No Cloudflare project has been provisioned by these repository changes.

## What is deployed

Listings use readable routes such as `/stands/maple-corner-gorham-me`. Direct links, refreshes and legacy GUID links work in the static sample; legacy links are replaced with the readable address in the browser. Sample slugs are explicit fixture fields and should remain stable when listing copy changes. Publishing these links does not require a cloud database migration.

`npm run build:sample` builds React/MapLibre with the ten checked-in fictional public fixtures in `apps/web/src/sample/stands.json`. Map tiles and destination search still go to Geoapify. Nearby filtering uses great-circle distance in the browser for this sample only. It does not expose or synchronize LocalDB. Changes to local seed records are not automatically published.

Normal `npm run dev` and `npm run build` retain the ASP.NET Core API and SQL Server geography behavior. The sample is not the deployed MVP backend: contributions, accounts, uploads, review and persistent server data remain unimplemented. Keep sample and future real deployments distinct. No migration or seeding command runs during the static build.

## Cloudflare Pages settings

### Existing Workers deployment

The founder's current site is `https://woodstop.nikita1984.workers.dev`, which uses Workers static assets rather than Pages. This can serve the same static sample; no migration to Pages is necessary. Use `apps/web` as the root directory, `npm ci && npm run build:sample` as the build command, and `npx wrangler deploy` as the deploy command. Keep the Geoapify key in build variables, not only runtime bindings. `apps/web/wrangler.jsonc` explicitly selects `dist`, SPA fallback, and a sample rebuild during deployment to prevent publishing the ordinary API-backed build.

A live check found the site serving `index-ChUJ56Rv.js`, the ordinary API build; its `/api/stands` requests returned HTML rather than data. This is the diagnosed cause of missing samples. After pushing the config and redeploying, verify that the site loads seven initial listings without `/api` requests and that stand-link refresh works. The live fix is not verified until that deployment completes.

The Pages-specific setup below remains an alternative. Workers preview/rollback controls differ from Pages; use the existing Worker's Versions & Deployments controls rather than creating a second project merely to fix the build mode.

Push the prepared changes to `NikitaGolovko/woodstop`, then create a **Pages** project using **Connect to Git**, granting Cloudflare access to this repository only.

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Root directory | `apps/web` |
| Framework preset | React / Vite, or None with the explicit values below |
| Build command | `npm ci && npm run build:sample` |
| Output directory | `dist` |
| `NODE_VERSION` | `26.13.0` (the development baseline) |
| `VITE_GEOAPIFY_API_KEY` | Dedicated browser-visible sample-site key |

`.github/workflows/sample-checks.yml` builds both modes and runs static desktop/mobile smoke tests in GitHub Actions using a fake provider key and no database. Third-party actions are pinned to commit SHAs. Require the `sample-checks` job in branch protection for `main` before treating it as a release gate. Pages does not automatically wait for unrelated GitHub checks; only merge passing commits. Pages itself needs no Chromium installation. The workflow is prepared locally; its first remote run and branch protection remain to be configured/verified.

Set variables for Production and Preview builds. The sample build fails when its map key is missing. `VITE_` values are compiled into browser assets: never put database passwords, Cloudflare API tokens or private credentials there. Restrict the Geoapify key to the exact production hostname and any deliberately enabled preview hosts. Do not allow all `pages.dev` websites. Key changes require rebuilding.

Use the generated HTTPS `*.pages.dev` hostname first; a custom domain can follow. Do not introduce a top-level `404.html`: Pages' SPA fallback handles `/stands/{id}` refreshes. `public/_headers` adds basic response headers and `noindex, nofollow` so the public sample is discouraged from search indexing. This is not access control.

## Release workflow

1. Work on a feature branch and run the normal app checks plus the sample build/smoke tests.
2. Push the branch. Cloudflare creates a preview deployment; test map/search with the origin-restricted key, stand links and mobile layout.
3. Merge reviewed changes to `main`; Pages builds and publishes that commit. Require passing checks before merging if enabling automatic public deployments.
4. Confirm the resulting HTTPS URL, map attribution, location permission after a tap, search, radius changes, list view, direct stand-link refresh and missing listings. The sample must make no `/api` calls.
5. For a failed release, use Pages' rollback to the previous successful production deployment. Preserve its commit identifier; revert/fix Git too so the next push does not reintroduce the failure.

For initial deployment, a successful local build is not evidence of a live site. Record the Cloudflare project, URL and deployed commit only after observing deployment success.

## Local verification of the static artifact

From `apps/web`, with the Geoapify key in `.env.local`:

```powershell
npm run build:sample
npm run test:sample
npm run preview -- --port 5184 --strictPort
```

The sample test server serves the production `dist` artifact without API proxying. Automated map responses are mocked so checks consume no provider credits. Live provider origins, tiles/search quality, Cloudflare header behavior and Pages routing still need checking after deployment. The normal build retains the existing large MapLibre chunk warning.

## Costs and future backend

Start with the Pages free plan and monitor its build/asset limits. Geoapify remains a separate quota; there is no assertion that traffic can grow indefinitely at no cost. No Azure bill is needed for the static sample.

Before real contributions launch, deploy the .NET backend with managed SQL (Azure App Service/Azure SQL remain the baseline candidates), establish controlled migrations, backups/restore, readiness checks, secrets/identity, logs and alerts. Serve the frontend from the API origin or deliberately configure a proxy/API origin and authentication protections. The static preview cannot substitute for those services, and the existing development seed remains forbidden outside Development.

References checked November 15: [Git integration](https://developers.cloudflare.com/pages/configuration/git-integration/), [SPA routing and caching](https://developers.cloudflare.com/pages/configuration/serving-pages/), [rollbacks](https://developers.cloudflare.com/pages/configuration/rollbacks/), [limits](https://developers.cloudflare.com/pages/platform/limits/).
