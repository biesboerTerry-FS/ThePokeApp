# Cloud storage setup (Cloudinary + MongoDB)

The app is cloud-first with a local fallback. Nothing needs configuring for the
demo to work: when cloud storage is not configured, avatars and "Add my photo"
sprites are stored as data URLs in the app's AsyncStorage state (`pokeapp:state:v1`)
and Pokédex entries are added to the bundled offline pool.

## 1. Cloudinary images (avatar + user photos)

1. Create a Cloudinary account and note your **Cloud name**.
2. In Cloudinary Settings → Upload → **Upload presets**, create a preset with:
   - **Signing mode: Unsigned** (required — the app uploads straight from the
     browser with `FormData`; a signed preset would need a server-side signature).
   - Folder: `thepokeapp` (the app sends this folder in the upload too).
   - Allowed formats: `image` (or leave unrestricted).
3. Add the two frontend env vars (they are embedded at build time):

   ```bash
   EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
   EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-unsigned-preset
   ```

   On Vercel, add them under **Project → Settings → Environment Variables** for
   `thepokeapp` (scope `thatdevterry`) and redeploy.

`src/api/cloudinary.js` POSTs to
`https://api.cloudinary.com/v1_1/<cloud name>/image/upload` and stores only the
returned `secure_url` in app state. If the vars are missing or the upload fails,
it falls back to a local data URL so the UI never breaks.

## 2. MongoDB Pokédex entries

Pokédex entries (including "Add my photo") are written through the existing
backend API in `src/api/client.js`: `createPokemon`, `getPokemonById`,
`updatePokemon`, `deletePokemon`. Configure `MONGODB_URI` on the
`thepokeapp-backend` Vercel project and deploy it; the frontend talks to it via
`EXPO_PUBLIC_API_BASE_URL` (must end in `/api/v1`).

When the backend is healthy (no 503) the entry lives in MongoDB. When it is
unreachable or degraded, `requestJson` uses the bundled offline pool and the app
also keeps a persistent local copy in `userPhotos`, so the sprite still appears
in the Pokédex and the detail carousel.

The frontend also runs a lightweight build-time health probe
(`scripts/check-backend.mjs`). While the backend answers 503, the built app
skips browser API calls completely and goes straight to offline data (no failed
network requests in the console). Once MongoDB is connected, **redeploy the
frontend** and the probe will enable the cloud/Mongo path automatically.

### User identifier

A stable `userId` (`trainer-<uuid>`) is generated once and stored in
`pokeapp:state:v1`. It is sent with every request via the `userId` query/body
parameter.

The backend now persists and scopes by trainer:
- `backend/models/Pokemon.js` has an `ownerId` field (indexed). Entries with an
  empty `ownerId` are the shared 1025-species seed roster; entries with an
  `ownerId` belong to that trainer.
- `GET /pokemon?userId=<id>` returns shared seed entries plus that trainer's
  own entries. `POST /pokemon` stores `ownerId` from the request. `PATCH` /
  `DELETE` reject modifications to another trainer's entries when a `userId`
  is supplied.
- The demo has no real sign-in, so scoping relies on the client-supplied id
  rather than a JWT. Authenticated routes are intentionally not required for
  the Pokédex endpoints.

MongoDB Atlas must allow connections from Vercel's serverless IPs. Add
`0.0.0.0/0` to the cluster's Network Access allowlist (Atlas → Network Access
→ Add IP Address → Allow Access from Anywhere) or add Vercel's static IP ranges.
The connection string used by the backend is `MONGODB_URI` (the server also
accepts the legacy `MONGO_URI` name) and must include the database name, e.g.
`mongodb+srv://…/pokedex`.

Seed the shared roster with `cd backend && npm run seed` (1025 entries).

## Storage paths at a glance

| Data | Cloud path | Fallback |
| --- | --- | --- |
| Avatar | Cloudinary `secure_url` | Data URL in AsyncStorage |
| User photo sprite | Cloudinary `secure_url` | Data URL in AsyncStorage |
| Pokédex entry | MongoDB via `createPokemon` | Bundled offline pool + local `userPhotos` |
