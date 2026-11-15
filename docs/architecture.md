# Architecture decisions and design follow-up

Updated November 15, 2026. **Local development has resumed at the founder's direction.** [MVP requirements](mvp.md) govern product behavior. No infrastructure or deployment is authorized.

## Baseline retained

November 15 public sample follow-up: [Cloudflare Pages deployment](deployment.md) is prepared as a separate static `sample` build with checked-in fictional listings and browser-only distance filtering. The ordinary app keeps the .NET/SQL design below. This preview is not a database/provider migration, does not expose LocalDB, and does not implement the backend MVP. Cloudflare project setup, repository connection and live deployment verification are still outstanding. No Azure resources are selected or provisioned for the sample.

One modular monolith: React/TypeScript/Vite frontend, C#/ASP.NET Core .NET 10 backend, EF Core SQL Server provider with NetTopologySuite, SQL Server locally. Azure App Service serving built web assets plus API, and Azure SQL, remain hosting candidates, not deployment commitments. One origin; Vite proxies API traffic locally.

Keep feature code together inside the existing backend rather than adding microservices, generic repository layers, Kubernetes, Redis, event buses, CQRS/MediatR or a monorepo manager. A database-backed admin review queue does not require a message broker. A notification stub does not require a separate deployed service.

Current implementation: health endpoint, public stand-detail and nearby reads, EF migration, fictional seed, map/list discovery foundation, and integration/browser tests. Map/search requires a configured Geoapify key; real coverage and remaining MVP behavior are not implemented. See development.md for run instructions.

## Product constraints for the next schema/API design

| Area | Settled behavior | Design consequence |
| --- | --- | --- |
| Identification | Pin plus short name OR description | Existing model validation requiring name AND description, town/state and source note must be revised; do not block contributions on missing metadata |
| Geography | Global submissions; Southern Maine initial view/field focus | No Maine-only coordinate validation; latitude/longitude must still be valid |
| Search | Destination-centered, default 10 miles, widening, nearest first | Translate 10 miles to 16,093.44 meters for SQL geography; exact paging/technical limits remain design work |
| Optional information | Prices include amount/currency/unit; hours/payment/notes optional | Existing hardcoded USD DTO is a reference-slice simplification to remove |
| Seasons | Annual start/end dates, visible outside season with reopening | Derive current season/reopening and In season filtering; specify cross-year/leap-day/timezone behavior before code |
| Publication | Pending/rejected submissions private; published version survives proposed/rejected edits | Separate published data from submitted revisions and moderation history |
| Photos | Optional, five/submission, resize, review before publication | Private upload staging, approved/pending states, local blob retention and retry design |
| Confirmation | One active member/stand, latest actual nonfuture observation | Separate observation and receipt timestamps; do not refresh from older visits |
| Badge | Two distinct active members within 90 days | Recalculate on withdrawal/merge and as time passes; no privileged founder badge |
| Merge/removal | Preserve history/content, old links redirect; hidden records privately restorable | Stable IDs, merge aliases, soft removal, review-state preservation and visibility checks |

Use longitude as X and latitude as Y for SRID 4326 points. Validate finite coordinates and execute distance queries in SQL Server geography for meter units; do not use client degree distances. Technical query bounds/paging are not user draft caps. The previous proposed 25 km default is superseded by 10 miles. Add indexes based on actual queries.

## Proposed records and permissions

Design identities/external logins, published stands, submission revisions/status/reasons, photo assets/review state, active confirmations and private history, reports, moderation actions, merge aliases and soft-removal state. These are planning concepts; no schema changes are made here. Avoid seller/payment entities until their features are authorized.

Members see their own submissions/history/account. Admins handle review and private retained content. Public DTOs expose approved content and confirmation display names, not emails, internal notes, pending photos or withdrawn confirmations. Approval is not a confirmation. Reports never mutate publication automatically.

Merge reconciliation must preserve content, photo review status and provenance while deduplicating each member's active confirmation using the latest applicable observation date. Do not resurrect withdrawn confirmations. Old URLs resolve through the surviving stand's access rules; no redirect may expose removed/hidden data.

## Authentication and verification

Launch: email/password plus Google. Microsoft/X later. Evaluate established .NET identity/authentication components; exact linking, recovery, session and CSRF design remains to be written. Require display name before contribution/confirmation, allow nicknames and keep emails private.

Gate email/password contributions on verified email. Define a development-only test verification mechanism until a provider exists; it cannot be enabled as a production bypass. Public launch with email/password contribution accounts requires actual verification delivery. This is separate from ordinary approval/rejection notification delivery, which remains stubbed.

## Client drafts, photos and submission handoff

IndexedDB is the proposed web fit for persistent draft records/photo blobs; final schema and resizing implementation remain open. Drafts are device/browser-local, not account-synced. No app cap/expiration; handle quota, clearing/eviction and write failures honestly. Loaded-app offline saving/editing is required, not offline map tiles or guaranteed cold-start offline access.

Preserve local content through sign-in and upload failure. Use stable submission identifiers/idempotency so retry cannot duplicate a submission. Only remove a local draft after the server acknowledges the completed submission; partial photo uploads are insufficient. Withdrawal requires a safe server-to-local transfer, including photos, without loss if storage fails or review happens concurrently.

Photos need client resizing and server validation; concrete byte/dimension limits, supported formats, storage provider, metadata removal and private/public asset handling remain technical decisions. Preserve existing approved photos during review of additions.

## Map and destination providers

Selected November 15: MapLibre GL JS for rendering, Geoapify for road-map tiles and destination search. Use the OSM Carto road style with provider/data attribution. Configure a browser-visible key through VITE_GEOAPIFY_API_KEY and restrict allowed origins in Geoapify. This key is public; private server credentials must never go in frontend variables. Search runs on explicit form submission, returning up to five choices without a country restriction. Queries go directly to Geoapify and are not persisted by Woodstop. Missing keys and provider failures leave list browsing available. Evaluate campsite/park/rural-address matches and credit consumption before public launch.

Nearby reads use SQL Server geography distance, a 10-mile default and selectable 25/50/100-mile radii. The API accepts positive radii up to 100 miles and returns the nearest 200 with a truncation indicator. Only published, non-closed reference-model records are returned. Coordinates are global. No schema change was needed. Stand markers cluster; curated destination anchors remain editorial work and are not implemented. Offline maps and automatic route search remain deferred. References: [Geoapify tiles](https://apidocs.geoapify.com/docs/maps/map-tiles/), [search](https://apidocs.geoapify.com/docs/geocoding/forward-geocoding/), [pricing](https://www.geoapify.com/pricing/).

## Notification boundary and operations

Define a small application boundary/stub for later notification delivery. Submission status and rejection explanations must work through the dashboard without email delivery. No provider, queue or separate service is needed for this slice.

Use user-secrets locally/protected host settings later; no private credentials in Git or frontend bundles. Browser map keys are public and require provider-side origin restrictions. Review and apply migrations explicitly rather than on startup. Before public launch: authorization checks, upload controls, TLS, backup/restore, appropriate monitoring/contact routes and a budget decision. Avoid storing precise traveler histories or logging location search query strings unnecessarily.

## Existing references

- [.NET support policy](https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core)
- [Vite prerequisites](https://vite.dev/guide/)
- [EF Core spatial support](https://learn.microsoft.com/en-us/ef/core/modeling/spatial)

These were consulted for the original baseline. Node was subsequently upgraded to 26.13.0 on this setup machine. Recheck versions/terms/prices when integrating or releasing services; the November 15 map-provider selection is recorded above.
