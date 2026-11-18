# Listings JSON and hosted submission inbox

Founder decision, November 15, 2026: keep published listings in checked-in JSON and collect real contributions in a small hosted inbox. No Azure resources are required. The .NET/SQL reference remains intact; the live inbox uses the existing Cloudflare Worker, a D1 database and Better Auth. These are separate from device-local drafts.

## Implemented flow

1. **Save a stand** requests precise location after the tap and immediately persists a private draft in IndexedDB. Denied/unavailable location falls back to map placement or typed coordinates. No sign-in is required to save/edit.
2. Drafts have no application count cap or expiry. Fields and up to five photo blobs autosave on-device, survive reload/sign-in, and remain editable when the loaded editor is offline. Storage failures are visible; clearing/eviction/quota can lose browser storage. Offline maps and guaranteed offline reopening are not provided.
3. Client photos are re-encoded to JPEG, at most 1600 pixels per side and 1 MB each. The server checks type, size, JPEG framing and dimensions; photos remain private in the inbox. D1 stores the small pilot's photo blobs in separate rows, avoiding the per-row size limit. A future larger photo service can move them to object storage.
4. An account, chosen display name and verified email are required to submit. Better Auth handles passwords, cookies, Google OAuth, verification and session checks; no custom password cryptography is used. Email/password registration requires a real email provider in production. Google sign-in is available when configured; automatic account linking by matching email is disabled.
5. Submission minimum: valid global pin plus name OR description. Price amount/currency/unit must be supplied together; payment, hours, access notes and photos are optional. Nearby public listings within one mile are shown before submission without blocking separate stands.
6. Each draft has a stable submission ID. The complete content/photos batch commits atomically to D1 before acknowledgement. Same-content retries return the existing record; mismatched reuse is rejected. Only then is the local draft removed. Failed requests/cleanup preserve the draft for recovery. Server status is shown in **My submissions**.
7. Pending items are visible only to their contributor and authorized admins. A server-side user-ID allowlist grants review access; being the first registered account never grants privileges. Admins review every photo and approve/reject with a required rejection reason. Decisions are version-checked and recorded in a private moderation history.
8. Pending withdrawal first writes the complete content/photos to a local draft, then conditionally marks the server record withdrawn. A failed storage write never withdraws server content. If review wins the race, the server record survives and the copied draft stays blocked until resolved. Withdrawal retries are idempotent. Rejected items can be revised into a new draft linked to the original history.
9. Approval does **not** mutate the deployed JSON. The admin downloads a merged `stands.json`, reviews/commits it to `apps/web/src/sample/stands.json`, and pushes to redeploy. Existing published records/edits are preserved in the export. Status reads Published only once the submitted ID is present in the deployed JSON. Approved photos are not publicly readable until that same publication step.

Season configuration, edits to existing public listings, confirmation/report history, admin merge/hide/restore tools, full account recovery UI and notification delivery remain later MVP work. The inbox/review flow is not a claim that the whole MVP is implemented.

## Local run

From `apps/web`, with the existing Geoapify key in `.env.local`:

```powershell
npm ci
npm run db:inbox:local
npm run dev:inbox
```

Open `http://127.0.0.1:8787`. This serves the JSON-backed website and inbox together, without .NET or SQL Server. Ordinary Vite/.NET development still works for the reference slice, but that API does not host this inbox.

The local-only config enables email registration and an explicit **Verify development account** button. Verification bypass requires both the local flag AND a localhost/127.0.0.1 URL; it is unavailable on the public Worker. Never deploy the local config or use its known test secret in production.

For tests, `npm run seed:inbox:test` inserts a known moderator only in Wrangler's local database. Its test password is intentionally public and must never be seeded remotely. Then run `npm run test:inbox`. The CI workflow initializes a local database and uses fake map responses; it needs no Cloudflare credentials, real OAuth keys or email delivery.

## Dashboard setup for the live Worker

The founder chose to configure Cloudflare through the dashboard. No hosted database, OAuth credentials or secrets have been created from this session. Code deployment alone continues to serve public listings, but account/submission endpoints return an honest not-connected response until the steps below are complete.

### 1. Create and initialize D1

In Cloudflare, create a D1 database named `woodstop-inbox`. For this NEW EMPTY database, run `apps/web/worker/dashboard-bootstrap.sql` in its SQL console. It creates the auth/inbox schema and records the two migrations; it contains no users or passwords. Inspect the output and stop on any error. Do not run this bootstrap against an existing application database. Future migrations must be reviewed/applied explicitly; no automatic migration runs on request/startup/deploy.

Copy its database ID into `apps/web/wrangler.jsonc` as a top-level configuration entry and push it:

```json
"d1_databases": [{
  "binding": "INBOX_DB",
  "database_name": "woodstop-inbox",
  "database_id": "YOUR_DATABASE_ID",
  "migrations_dir": "migrations"
}]
```

The ID is a resource identifier, not a password. The binding must be in deployment configuration so subsequent Git deployments retain it; a dashboard-only binding can be overwritten by Wrangler. Do not put the local all-zero ID here.

### 2. Configure runtime settings

Under the `woodstop` Worker's runtime Variables and Secrets (distinct from build variables), set:

| Setting | Value |
| --- | --- |
| `APP_ORIGIN` (text) | `https://woodstop.nikita1984.workers.dev` with no trailing slash |
| `BETTER_AUTH_SECRET` (secret) | A strong random value of at least 32 characters, saved in a password manager |
| `GOOGLE_CLIENT_ID` (text or secret) | Google OAuth web-client ID |
| `GOOGLE_CLIENT_SECRET` (secret) | Google OAuth web-client secret |
| `ADMIN_USER_IDS` (text) | Set after your first sign-in as described below |

`keep_vars` preserves dashboard runtime variables across deployment. Keep private values out of Git and all `VITE_` variables. The existing `VITE_GEOAPIFY_API_KEY` remains a browser-visible build variable with origin restrictions. Do not set `LOCAL_DEVELOPMENT` on the public Worker.

Create a Google OAuth web client with the authorized redirect URI:

`https://woodstop.nikita1984.workers.dev/api/auth/callback/google`

Configure its consent/audience settings for the intended users (add your account as a test user if the Google app is in testing mode). Google sign-in and real email delivery require their own live verification; local tests do not validate these external services.

For email/password registration too, configure `RESEND_API_KEY` (secret) and `EMAIL_FROM` with a verified sending identity in Resend. The sender is used only for account verification/recovery, not submission notifications. Without these, public email registration is disabled; Google can still be used. This preserves the public-launch verified-email requirement.

### 3. Grant your review access

Deploy, sign in, and choose a display name. In D1's `user` table, find your account and copy its **id** into the Worker's runtime `ADMIN_USER_IDS`. Multiple IDs may be comma-separated. Do not use your email address, password or session token as the value.

Refresh `/account`; **Review queue** should appear. Other members must not see the queue or private submissions. Before inviting others, verify this with a second account.

### 4. Publish approved listings

At `/review`, inspect details/photos and approve or reject. Download the approved listings JSON, review the diff, replace `apps/web/src/sample/stands.json`, and push to the connected production branch. The export excludes private account data and pending/rejected content. Do not manually add a pending record to public JSON.

The JSON file and the D1 inbox need separate retention: Git tracks published listing changes, while D1 holds accounts, private submissions/photos and moderation history. Configure/check D1 backup/Time Travel and verify recovery before relying on it for real contributions. Reverting a Worker deployment does not roll back the database.

## Verification and limits

Local browser checks cover capture, resized photo persistence, loaded-editor offline edits, verified-account gating, successful handoff, same-ID retry, private data access, CSRF rejection, admin review, export, failed-submission preservation and storage-safe withdrawal. Static discovery/deep-link checks remain separate. Production Worker bundling is checked with Wrangler dry-run.

Latest local verification, November 15, 2026: all four inbox browser checks passed across desktop/mobile, and `build:sample` passed frontend and Worker type checks plus production asset compilation. Draft screenshots were inspected. These results do not verify hosted D1 bindings, Google OAuth or real email delivery.

There is no assertion that the inbox is live or free without limit. Cloudflare plan/request/CPU/storage quotas and optional email delivery apply separately. Password hashing is deliberately expensive; check Workers CPU limits and use an appropriate plan if enabling password accounts. Accounts are rate-limited and each member may create 20 submissions/hour; this is not a local draft cap. Upload requests are bounded to 8 MB. Public listings remain JSON-backed regardless of inbox size.

References: [D1 setup](https://developers.cloudflare.com/d1/get-started/), [Google authentication](https://better-auth.com/docs/authentication/google), [Workers pricing/limits](https://developers.cloudflare.com/workers/platform/pricing/).
