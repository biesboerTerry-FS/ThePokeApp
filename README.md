# thePokêApp

A no-sign-in Pokédex demo built with Expo (React Native Web). It ships a full
1025-species roster, a Card Match game, a per-trainer Caught/Favorite collection,
and Cloudinary-backed avatars with a local fallback.

## Stack

| Layer | Technology |
| --- | --- |
| App | Expo 54, React Native, React Navigation, react-native-web |
| Storage | AsyncStorage (web: localStorage) for all trainer state |
| Images | Cloudinary (unsigned upload) with local data-URL fallback |
| Data source | 1025-species bundled seed roster; optional MongoDB via Express API |
| Hosting | Vercel (Expo web static export) |

## Run locally

```bash
npm install
npm run dev        # Expo dev server (web / iOS / Android)
npm test           # 33 unit tests
npm run build      # Expo web export into dist/ (used by Vercel)
```

Open the web URL Expo prints. There is no login — the app opens straight to Home.

## Features

- **Pokédex** — full 1025-species roster with search, paging, and Caught/Favorite filters.
- **Pokémon details** — large sprite, name/type/level display, a sprite carousel
  with arrows, and Catch / Favorite toggles. Display-only: entries are not added,
  edited, or released from the app.
- **Card Match** — flip-and-match game with Easy / Medium / Hard difficulties and
  per-difficulty stats.
- **Settings** — trainer name, difficulty, avatar upload, Card Match stats with a
  two-step "Reset stats" confirmation (works on web and native).
- **Trainer avatar** — uploaded to Cloudinary when configured; otherwise stored
  locally as a data URL.
- **Persistence** — all trainer state (name, avatar, caught, favorites, local
  image edits, stats) lives in AsyncStorage under `pokeapp:state:v1` and survives
  reloads.

## Deployment

Vercel team `thatdevterry`:

| Project | Purpose | URL |
| --- | --- | --- |
| `thepokeapp` | Expo web app | https://thepokeapp.vercel.app |
| `thepokeapp-backend` | Express + MongoDB API (optional) | https://backend-phi-lemon-54.vercel.app |

Deploy the frontend from the repo root (`vercel --prod --yes -p thepokeapp
--scope thatdevterry`) and the backend from the repo root too — its Vercel
`rootDirectory` is `backend`. Purge the CDN cache after each deploy.

## Environment variables

Frontend (`thepokeapp`), build-time:
```
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=duvybjyfc
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=codePoke
EXPO_PUBLIC_API_BASE_URL=https://backend-phi-lemon-54.vercel.app/api/v1
```

Backend (`thepokeapp-backend`):
```
MONGODB_URI=mongodb+srv://…/pokedex
```

See [`CLOUD_STORAGE_SETUP.md`](./CLOUD_STORAGE_SETUP.md) for details and
[`backend/README.md`](./backend/README.md) for the API.

## Notes

- The demo works fully offline — cloud services are optional.
- The backend currently reports `degraded` until MongoDB Atlas allows Vercel's
  IPs (Network Access → `0.0.0.0/0`). The app transparently uses the bundled
  roster and local state in the meantime.
- There is no Clerk/sign-in in this app; the trainer name is the only identity.
- Attribution for the favicon is in [`ATTRIBUTION.md`](./ATTRIBUTION.md).
