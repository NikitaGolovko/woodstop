# Woodstop MVP requirements

Consolidated November 8, 2026 from the founder's planning decisions. This document is the authoritative product scope, superseding earlier founder-only directory proposals. Requirements are planned behavior, not claims of implementation. **Development remains paused until the founder explicitly resumes it.**

## 1. Audience, coverage and success

Help campers and hikers traveling to a campsite or destination find roadside firewood bundle stands nearby. Community contributions are central: users add stands they know or own, improve missing information and confirm existence.

Launch a mobile-friendly website first. Native iPhone/Android apps come later, after learning from the pilot. Seed and revisit Southern Maine first, followed by popular nearby destinations. This is a coverage focus, not a geographic restriction: accept stand submissions everywhere and allow destination searches outside Maine. Do not imply complete coverage.

Pilot learning targets, not hard release gates:

- 20 approved stands in Southern Maine.
- Five contributors besides the founder.
- Four of five testers can find a suitable stand and open directions without help.

Assess community traction, useful/repeat contributions, coverage improvements, confirmations, directions intent, inaccurate listings and review workload. Directions taps do not prove visits or sales.

## 2. Map-first discovery

- Open on a simple road map centered on Southern Maine, with a list alternative. No satellite or terrain layers.
- Search a town, campsite, park or address and show stands around that destination. Automatic along-route discovery and route optimization are deferred.
- Default radius: **10 miles**, with an option to widen the search. Order results nearest first and label distance as straight-line; do not imply driving distance/time.
- Request location permission only when the user taps **Use my location** or **Save a stand**, never automatically on launch. Destination search/manual map use remain available if permission is denied.
- At wider zoom levels, show distinct clickable anchors for a curated set of major Maine parks, camping areas and tourist destinations. Tapping an anchor centers/explores that area and shows nearby stands. User suggestions for additional anchors can come later. Exact initial destinations remain to be curated.
- Cluster nearby stand pins when zoomed out; tapping a numbered cluster zooms in. Keep destination anchors visually distinct from stand pins/clusters.
- Launch filters: **Community confirmed** and **In season**. Show all stands by default, including unconfirmed approved listings and out-of-season seasonal stands. "All" does not expose pending, hidden or removed listings.
- Published stand details have stable, shareable links and a **Share** action. Recipients can open them without an account. Open navigation using the stand's actual coordinates.
- Include useful loading, empty, denied-location, missing-listing and request-failure states, with an accessible list alternative to the map.

## 3. Accounts and public access

Browsing, published details and local drafts require no sign-in. Encourage accounts without blocking those actions.

Launch authentication: **email/password plus Google**. Microsoft and Twitter/X are later options. Use established authentication/security components; a first-party account system does not mean writing custom password cryptography.

Submitting locations/edits/photos, confirming stands and ordinary problem reports require an account. Require a chosen display name before submitting or confirming; nicknames are allowed and a real name is not required. Public confirmations show the chosen display name, never the email address.

Email/password accounts must verify their email before submitting or confirming. Stub the verification flow for development until an email provider is configured. A development stub must not silently satisfy real verification in production. Real verification delivery is required before a public launch using email/password contribution accounts.

The signed-in dashboard includes account information, **My submissions** with status/rejection explanations and confirmation/report history. Submitted items are available across devices after sign-in; unsubmitted drafts are local to the device/browser where created.

Stand owners use the same contribution and review process as other members. No special editing/deletion privileges or owner identity verification in the pilot. Advanced owner management and camera/webcam evidence are later work.

## 4. Save a stand and local drafts

Use the exact primary action **Save a stand**, prominent from the initial map. One quick action requests precise location and saves a private draft without an account or full form. Allow pin adjustment/manual placement when necessary. Saving is not submission or publication.

Persist drafts and their selected photos on the client, surviving closing/reopening the app and sign-in. No app-imposed draft count cap, expiration date or cleanup timer. Device/browser storage can run out, be cleared or evicted; show persistence failures honestly and do not promise permanent retention.

When the site is already loaded, users can save/edit drafts offline if location is available, or place the pin manually. Submit when connected. Offline maps, fresh searches and guaranteed offline reopening of the website are not promised. No cross-device draft synchronization at launch.

Keep photos locally with their draft and upload on submission. Up to **five photos per submission**, with automatic resizing. Photos are optional and can be added later. Failed uploads/submissions preserve the draft and photos for retry. Prevent duplicate submissions on retry.

Keep the local draft until the server acknowledges a successful complete submission. Then remove it from local drafts and show it in **My submissions** as **Pending review**. An upload starting or partially succeeding is not submission acknowledgment.

Contributors can withdraw their own pending submissions and return the content, including photos, to a local draft for editing/resubmission. Do not lose the submitted content if writing the local draft fails; design the handoff before implementation.

No dedicated driving warnings, driving-specific prompts or restrictions are required in this MVP.

## 5. Submission content and editing

Minimum submission: **a map pin and a short name OR description**. Do not require both, a verified visit, town/state, price, photo or source note as contributor-entered prerequisites. Derive optional geographic metadata where practical, without blocking global submissions.

Optional fields: photos, price amount/currency/sale unit, payment methods, hours, access notes and seasonal configuration. An optional price includes all three of amount, currency and sale unit; do not assume USD for global submissions. Missing information is unknown, not guessed.

Before submission, show nearby existing stands so contributors can confirm or propose changes to one instead of creating a duplicate. Do not block a genuinely separate nearby stand simply because another exists.

Owners and other contributors can propose changes to published listings. Keep approved public details unchanged while proposed edits await review. If rejected, keep the published version, show the contributor the rejection reason and allow revision/resubmission. Rejected new submissions likewise remain editable/resubmittable without starting over.

### Seasons

Allow a seasonal stand option with contributor-configured start/end dates, repeating annually by default. Contributors can propose date changes through normal review. Outside those dates, keep the stand visible with **Out of season** and show when it reopens. The In season filter can exclude it. A seasonal schedule is not a guarantee of stock or daily opening hours. Exact cross-year/leap-day/timezone boundary handling is a technical design detail still to specify.

### Photos

Review every new photo before public display, including additions to existing stands. Existing approved photos stay visible while new ones await approval. No photo becomes public merely because an upload completes.

## 6. Publication and administrator workflow

The founder reviews and approves every new listing before publication. Pending submissions are private to the contributor and authorized admins. Include a basic admin dashboard/review queue in the MVP; a local import tool is not a substitute.

Admins inspect location/details, review photos, correct information, approve/reject, handle reports, merge duplicates, hide/remove and restore listings. Require a short rejection reason visible to the contributor so they can edit and resubmit. Keep moderation history and enforce authorization on the server.

Approval to publish is distinct from existence confirmation. It does not create a privileged confirmation or special founder badge. The later possibility of publishing unconfirmed community submissions without preapproval is deferred until traction warrants changing policy.

### Duplicate merging

Allow admins to merge duplicates into one surviving stand. Preserve submission/contribution history, approved/pending photo states, confirmation history, reports and other content. Count each person only once for the surviving stand; use their latest applicable active observation date. Retain withdrawn history privately without reviving it. Redirect old shared links to the surviving stand, subject to its publication visibility.

### Reports and removal

Signed-in report options: **Location is wrong**, **Stand appears closed**, **Other issue**. Send reports to the admin queue; they do not automatically change public details or unpublish a stand. Admins can hide a concerning listing while investigating.

All listings have a removal path. Ordinary member removal requests require sign-in and admin action. Also provide a basic contact option without sign-in for property owners requesting a listing's removal. Do not grant direct owner deletion privileges in the pilot.

Removed listings are hidden from public view, with records retained privately for admins to restore. A merged link must not bypass hidden/removed visibility.

## 7. Confirmations and badge policy

The action is **I've seen this stand**. Explain that it confirms a stand exists, not that firewood is currently in stock.

- One active confirmation per person per stand. Reconfirming refreshes the date without counting that person twice.
- Default observation date to today; allow the date actually seen in the past and reject future dates.
- Keep that member's latest observation date. Recording an older visit does not replace a newer one or extend freshness.
- **Community confirmed** requires at least **two distinct members** with active observations within the past **90 days**. Display the latest confirmation date. Older confirmations remain in history but do not count toward the badge.
- Contributors and owners can confirm their own submitted stands. They still need a second distinct person for the badge.
- Founder/admin confirmations count as regular member confirmations. No separate **Checked by Woodstop** badge or privileged admin field-check mechanism is planned.
- Members can withdraw only their own confirmation. Immediately recalculate public counts/badge. If fewer than two current members remain, remove the badge without unpublishing the listing.
- Withdrawn confirmations are retained privately for moderation and excluded from public counts, badge and public confirmation history.
- Chosen display names accompany public confirmations; email addresses stay private.

No ratings, star scores or public comments. Existence confirmation, publication approval, ownership and availability must remain distinct.

## 8. Notifications, trust and operating limits

Notifications are planned, but provider/delivery implementation is deferred. Define a small notification boundary/stub for now; no email provider, messaging infrastructure or notification delivery gate is needed merely to display submission status. Dashboard statuses and rejection reasons must work regardless of delivery. Email verification's real-public-launch dependency is separate from optional notification emails.

Brief unobtrusive guidance should mention unverified location information and buying local firewood. Badges do not guarantee safety, stock, ownership or destination compliance. Avoid publishing personal account information or treating an arbitrary residential pin as an advertised stand. Provide correction/removal paths. Link to checked official guidance before launch rather than inventing regulatory rules.

Price/payment dates stay separate; editing a description must not refresh unrelated facts. Unknown values remain unknown. Stockout does not imply permanent closure. Do not infer hours/treatment/stock from photographs. No live inventory guarantee is planned.

## 9. Acceptance checklist for the planned pilot

- Anonymous map/list discovery, destination search, 10-mile default, curated anchors, clustering, two agreed filters, share links and directions.
- Southern Maine initial view; no location permission until an explicit location/capture action; submissions accepted globally.
- Account-free persistent local drafts/photos, no cap/expiration, loaded-app offline editing, safe retry and acknowledged handoff to My submissions.
- Submission minimum is pin plus name OR description; optional currency/unit-aware prices, seasonal dates and resized photos (five per submission).
- Email/password and Google, display names and verified-email contribution gates, with clearly development-only verification stub until real delivery exists.
- Cross-device member dashboard, pending withdrawal, rejection reasons and edit/resubmit for listings and changes.
- Admin approvals, photo review, unchanged public versions during review, duplicate merges/redirects, reports, private removal/restoration and anonymous property-owner contact.
- Two-person/90-day confirmation rules, latest nonfuture observation, self-confirmation, immediate withdrawal recalculation, private withdrawal history and no privileged founder badge.
- Notifications stubbed; no ratings/comments, native apps, offline maps or automatic route search.
- Planned behavior is distinguished from implemented demo; external release still requires permissions/privacy checks, appropriate operational setup and real email verification.

## 10. Remaining technical work to decide before implementation

Map tiles/geocoding providers and their costs/terms; curated anchor content; local draft/photo storage design and resizing details; secure photo hosting/review; authentication linking/recovery and development verification stub; precise seasonal/freshness date boundaries; merge/withdraw concurrency; production hosting/budget. These do not reopen the settled product choices above. No infrastructure or code implementation is authorized by this document update.
