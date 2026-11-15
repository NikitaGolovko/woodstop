# Woodstop web

React + TypeScript + Vite map/list discovery foundation and stand-detail reference. See [local development](../../docs/development.md) for Geoapify key setup, API/database requirements, current limitations, and verification.

Routes: `/` opens discovery; `/stands/{uuid}` loads public details. Frontend dependencies are pinned with a lockfile. MapLibre renders Geoapify tiles; destination search uses Geoapify. The list remains available without a map key. Save a stand/local drafts and contributions are not implemented yet.
