# Implementation plan and planning status

Consolidated November 8, 2026; status updated November 15. **The founder resumed local development**, selecting MapLibre with Geoapify. [MVP requirements](mvp.md) are authoritative. Retain Save a stand and ignore the wireframe's Local Listing Editor. Cloud provisioning/deployment require separate direction.

## Active slice: discovery foundation

November 15 submission follow-up: the founder selected JSON-backed public listings plus a small Cloudflare inbox. Implemented locally: precise-location/manual drafts, IndexedDB/photo persistence, accounts and verified contribution gates, atomic/idempotent inbox submission, member statuses, pending withdrawal, rejection revision, admin/photo review and approved JSON export. [Setup and limits](submission-inbox.md) distinguish local verification from dashboard configuration still needed. The .NET reference is unchanged; no Azure resources are needed for this stage. The full discovery/confirmation/moderation MVP is not complete.

Implemented: MapLibre road-map integration, Geoapify destination search with explicit result selection, Southern Maine initial center, map/list views, stand clustering and selection, Search this area, explicit Use my location, 10-mile default with wider radii, SQL geography nearby reads, public-only results, and loading/empty/error/retry states. No schema changes. List discovery remains available without a map key. The existing stand-detail reference and fictional seed remain.

Still pending before the full discovery gate: real provider/key evaluation, curated anchors, confirmation/season models and filters, season/reopening dates, approved flame-pin artwork for markers and Share. The new inbox/draft implementation is recorded above; public auth/delivery configuration and broader moderation remain incomplete. The November 8 reference-slice description below is historical.

## Implemented reference slice

React/TypeScript/Vite and a .NET 10 API read a fictional stand from SQL Server LocalDB. Includes geography-backed storage, explicit migrations, public detail DTO, dated/unknown facts, directions, hidden-listing protection and a fictional seed. At completion, nine SQL Server integration tests and eight desktop/mobile browser tests passed. Those are historical results, not a new verification run for this documentation update.

The demo is not the full agreed MVP. Its required fields, fixed USD currency and other simplifications need reconciliation with the new requirements; do not treat them as product decisions. No accounts, finder map, drafts, submissions, confirmations, admin/member dashboards or real coverage have been implemented.

## 1. Resolve technical design without reopening product choices

- Compare map tile/geocoding services against destination search, global submissions, rural coverage and costs/terms. Curate the first major Maine anchors.
- Specify local persistent drafts/photo blobs, five-photo resizing, loaded-app offline behavior, acknowledged submission and pending withdrawal handoff.
- Design email/password + Google authentication, display names, account linking/recovery, verified-email gate and a development-only verification stub.
- Design submission revisions/photo review, confirmation/history, reports, merge aliases and soft-removal authorization.
- Specify annual season boundaries, latest observation dates, 90-day badge calculations and merge/retry concurrency.
- Sketch map, draft, member and admin flows. Keep notification delivery behind a stub; no provider setup now.

Gate: technical approach is reviewable and founder explicitly authorizes development to resume.

## 2. Map-first discovery and public detail

- Southern Maine initial road map, destination search (town/campsite/park/address), 10-mile default/widen option and nearest-first straight-line results.
- Curated major Maine destination anchors; stand clustering, list alternative; Community confirmed and In season filters with all public stands shown initially.
- Seasonal recurring dates, visible Out of season/reopening information, shareable public details and Share action.
- No automatic location prompt, terrain/satellite layers or along-route planning. Global submissions/search supported even though coverage starts locally.

Gate: anonymous users can search and open accurate directions; map/list agree, deep links and accessible/error states work.

## 3. Save a stand and local drafts

- Quick precise-location capture/manual pin without login or full form; persistent device-local drafts, no product count cap/expiration.
- Save/edit when loaded offline; optional local photos, up to five per submission with resizing. Do not build offline maps or cross-device draft sync.
- Preserve photos/content on upload failure and submission retry; discard local draft only after complete server acknowledgment.

Gate: draft/photo persistence, location/storage failures and retry scenarios pass without data loss.

## 4. Accounts, submissions and member dashboard

- Email/password + Google, nickname/display-name requirement and verified-email contribution gate; stub verification only for development.
- Minimum pin + short name OR description; optional currency/unit-aware price, payment, hours, notes and seasons. Owners follow normal review.
- Nearby-stand suggestions before submission; duplicate-safe submissions/edits and photos.
- My submissions available across devices with statuses/reasons, revise/resubmit, pending withdrawal back to local draft and account/confirmation/report history.
- Notification boundary/stub, with dashboard independent of delivery.

Gate: account permissions protect private data; submissions survive retries/withdrawal; rejected edits do not alter published details.

## 5. Review, confirmations and removal

- Founder/admin queue, approve/reject with required short reason, new photo review while approved versions stay visible, moderation history.
- I've seen this stand: one person/stand, latest actual nonfuture visit date; two distinct active observations in 90 days for Community confirmed. Self-confirmation allowed, founder treated the same. Display names public, emails private.
- Immediate badge recalculation on withdrawal, private withdrawn history; no ratings/comments.
- Duplicate merges preserve content/history/review states, deduplicate confirmations and redirect old links.
- Three agreed report options, no automatic listing changes; anonymous property-owner contact; private soft-removal and admin restoration.

Gate: full contribution-to-publication path, badge rules, merge/link behavior and removal authorization are verified end to end.

## 6. Southern Maine pilot and production readiness

- Seed/revisit Southern Maine and nearby destinations; no geographic submission block.
- Learning targets: 20 approved Southern Maine stands, five nonfounder contributors, four of five testers finding a stand/opening directions without coaching. These are learning targets, not hard launch gates.
- Assess useful contributions, traction and moderation workload.
- Before public release: budget/provider decisions, HTTPS/secrets, migrations/backups/restore, permissions/upload protection, monitoring, actual property-owner contact and checked guidance. Real email verification must replace the development stub for public email/password contributions.
- Deploy only after explicit resumption/deployment decisions. No cloud setup as a side effect of planning.

## Later

Native mobile apps, offline maps/downloads, cross-device draft sync, Microsoft/X sign-in, user-suggested anchors, automatic along-route search, owner identity/management/camera evidence and public unconfirmed publication policy. Ratings/comments, payments and live inventory guarantees are outside the agreed launch scope.
