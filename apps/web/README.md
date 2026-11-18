# Woodstop web

React + TypeScript + Vite map/list discovery foundation and stand-detail reference. See [local development](../../docs/development.md) for Geoapify key setup, API/database requirements, current limitations, and verification.

Routes: `/` opens discovery; `/stands/{slug}` loads public details (old GUID links still resolve); `/drafts` holds private device-local drafts; `/account`, `/submissions` and `/review` provide the authenticated Cloudflare inbox flow. MapLibre/Geoapify supply map/search. Public listings remain checked-in JSON in the sample build; approved inbox records are exported and committed before publication. See [inbox setup](../../docs/submission-inbox.md) for local run and dashboard configuration. The .NET reference API remains separate and does not host the inbox.
