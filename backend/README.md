# Pokédex API

Express + MongoDB (Mongoose) backend for the Pokédex app. The app talks to it at
`http://localhost:8000/api/v1` by default.

## Setup

```bash
cd backend
npm install
cp .env.example .env   # then fill in MONGODB_URI
npm run seed           # loads the 1025-Pokémon roster from ../src/data/pokemonSeed.json
npm start              # or: npm run dev (restarts on change)
```

Health check: `GET /api/v1/health` returns 200 when the database is connected.

## Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/pokemon?userId=<id>` | – | List shared + this trainer's Pokémon |
| GET | `/pokemon/:id` | – | One Pokémon |
| POST | `/pokemon` | – | Add a Pokémon (stores `ownerId` from body) |
| PATCH | `/pokemon/:id` | – | Update a Pokémon (owner-only when `userId` supplied) |
| DELETE | `/pokemon/:id` | – | Release a Pokémon (owner-only when `userId` supplied) |

The app itself only uses `GET /pokemon` and `GET /pokemon/:id`; the write routes
exist for completeness. Scoping relies on the client-supplied `userId` because the
demo has no real sign-in.

## Database

Set `MONGODB_URI` in `.env`. The local default is `mongodb://127.0.0.1:27017/pokedex`.
For a hosted cluster, paste its connection string (include the database name).

Collections: `pokemons`. Entries with `ownerId: ''` are the shared 1025-species
seed roster; entries with an `ownerId` belong to a trainer.

The API still starts when the database is unreachable. Data routes return 503 until
it connects. On Vercel, MongoDB Atlas must allow serverless IPs (Network Access →
`0.0.0.0/0`); otherwise health stays `degraded` and the frontend uses its bundled
offline roster instead.
