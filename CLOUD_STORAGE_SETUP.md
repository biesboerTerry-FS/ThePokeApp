# Cloud storage & persistence setup

The app is cloud-first with a local fallback. Nothing needs configuring for the
demo to work — it uses the bundled 1025-species roster and stores all trainer
state in AsyncStorage (web: `localStorage`) under `pokeapp:state:v1`.

## What is stored locally (always)

These are per-trainer and persist across reloads without any cloud setup:

| Data | Where |
| --- | --- |
| Trainer name, difficulty | `pokeapp:state:v1` |
| Card Match stats (and Reset stats) | `pokeapp:state:v1` |
| Caught ids, Favorite ids | `pokeapp:state:v1` |
| Local image edits / avatar data URL fallback | `pokeapp:state:v1` |

## 1. Cloudinary images (avatar)

The only user-uploaded image in the app is the **Settings avatar**. When Cloudinary
is configured it uploads straight from the browser with `FormData` and stores only
the returned `secure_url`.

Setup:
1. Cloudinary account → note your **Cloud name**.
2. Settings → Upload → **Upload presets** → create an **Unsigned** preset
   (required — a signed preset needs a server-side signature). Folder `thepokeapp`.
3. Add build-time env vars on the `thepokeapp` Vercel project (scope `thatdevterry`)
   and redeploy:

   ```
   EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=duvybjyfc
   EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=codePoke
   ```

`src/api/cloudinary.js` falls back to a local data URL if the vars are missing or
the upload fails, so the avatar always works.

## 2. MongoDB API (optional data source)

The app reads the roster from the backend at
`EXPO_PUBLIC_API_BASE_URL` (must end in `/api/v1`). When the backend is healthy the
list comes from MongoDB; when it is degraded (503) or unreachable, `requestJson`
uses the bundled offline pool. A build-time probe (`scripts/check-backend.mjs`)
skips browser API calls entirely while the backend is down, so there are no
failed network requests. **After the database connects, redeploy the frontend** to
enable the cloud path.

Backend env (`thepokeapp-backend`):
```
MONGODB_URI=mongodb+srv://…/pokedex
```
The server also accepts the legacy `MONGO_URI` name. The database name must be in
the URI (e.g. `/pokedex`).

MongoDB Atlas must allow Vercel's serverless IPs: Network Access → Add IP Address
→ **Allow Access from Anywhere (`0.0.0.0/0`)**. The local seed connection works
from your machine, but Vercel's functions need the allowlist entry.

Seed the shared roster: `cd backend && npm run seed` (1025 entries).

### Backend model & scoping

- `backend/models/Pokemon.js` has an indexed `ownerId` field.
- `GET /pokemon?userId=<id>` returns shared seed entries plus that trainer's
  entries; `POST` stores `ownerId`; `PATCH`/`DELETE` block editing another
  trainer's entries. There is no JWT gate (the demo has no real sign-in).
- The app itself only reads the roster and updates a sprite via local overrides;
  it no longer creates or releases entries.

## Storage paths at a glance

| Data | Cloud path | Fallback |
| --- | --- | --- |
| Avatar | Cloudinary `secure_url` | Data URL in AsyncStorage |
| Roster | MongoDB via `GET /pokemon` | Bundled 1025-species seed pool |
| Caught / Favorites / stats / edits | — (local only) | AsyncStorage |
