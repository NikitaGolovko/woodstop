# Woodstop

Find firewood near you.

Woodstop helps campers and travelers locate roadside firewood bundle stands, understand how to buy, and open directions. The planned MVP is a map-first, community-built directory with private client drafts, signed-in contributions and confirmations, and member/admin dashboards.

## Start here

1. [MVP scope](docs/mvp.md): users, journeys, boundaries, and release criteria.
2. [Architecture](docs/architecture.md): stack, data, API, and deployment decisions.
3. [Implementation plan](docs/implementation-plan.md): ordered slices and completion gates.
4. [Local development](docs/development.md): prerequisites and commands.

## Repository

```text
apps/
  api/                 ASP.NET Core API; one production backend project
  web/                 React + TypeScript stand-detail frontend
docs/                  Product, architecture, delivery, and fieldwork guidance
```

SQL Server integration tests live in `tests/api/`; browser tests live in `apps/web/e2e/`. Add shared packages only when there are actual consumers; no empty domain/application/infrastructure projects, mobile app, or infrastructure directory is needed yet.

## Current state

The first stand-detail slice is implemented: React loads a public stand through the ASP.NET Core API from SQL Server geography-backed storage. A development-only fictional seed, explicit EF migrations, directions links, dated/unknown facts, visibility checks, and desktop/mobile browser tests are included. Nearby search, map discovery, real stand data, authentication and deployment are still pending. See local development to run the preview.

## Current planning decisions

**Development remains paused until explicitly resumed.** All agreed product decisions are consolidated in [MVP scope](docs/mvp.md), November 8, 2026. Planned behavior is distinct from the implemented fictional stand-detail reference above.

- Web-first, Southern Maine initial view and seeding, with submissions allowed everywhere.
- Road map, town/campsite/park/address destination search, 10-mile default radius, curated major Maine destination anchors and clustered stand pins. No terrain/satellite or along-route search.
- Community confirmed and In season filters, all public stands shown by default; shareable public stand links.
- Save a stand: anonymous persistent device-local drafts/photos, no draft count cap/expiration, loaded-app offline editing, safe upload retries and acknowledged handoff to My submissions.
- Pin plus short name OR description is enough; other details optional. Five optional resized photos per submission. Annual seasonal dates, visible Out of season/reopening information and amount/currency/unit prices.
- Email/password + Google for launch, display names/nicknames, private emails and email verification before email/password contributions. Verification stub is development-only; real delivery needed for public release.
- Member submissions/status/history across devices, pending withdrawal to local draft, required rejection reasons and revise/resubmit.
- Founder approval, admin/photo review, duplicate merges preserving content/history and redirecting links, reports and privately restorable removal. Anonymous property-owner removal contact remains available.
- I've seen this stand: two distinct current members within 90 days for Community confirmed; one confirmation/member/stand, latest nonfuture actual visit date, self-confirmation allowed, immediate withdrawal recalculation and private withdrawn history. No privileged founder badge, ratings or comments.
- Notification boundary/stub now; provider/delivery later. Dashboard status does not depend on delivery.
- Pilot learning targets: 20 approved Southern Maine stands, five nonfounder contributors and four of five testers completing discovery/directions without help; these are not hard release gates.

Remaining work is technical design/provider evaluation and editorial destination selection; see [architecture](docs/architecture.md) and [implementation plan](docs/implementation-plan.md). The October 18 platform plan is historical reference, not the current release checklist. No code, schema, cloud setup or deployment is authorized by this documentation consolidation.
