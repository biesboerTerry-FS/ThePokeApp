# Pokédex API

Express + MongoDB (Mongoose) backend for the Pokédex app. The app talks to it at
`http://localhost:8000/api/v1` by default.

## Setup

```bash
cd backend
npm install
cp .env.example .env   # then fill in MONGODB_URI, JWT_SECRET, CLERK_SECRET_KEY (and legacy GOOGLE_CLIENT_ID if needed)
npm run seed           # loads the 1025-Pokémon roster from ../src/data/pokemonSeed.json
npm start              # or: npm run dev (restarts on change)
```

Health check: `GET /api/v1/health` returns 200 when the database is connected.

## Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/pokemon` | – | List Pokémon |
| GET | `/pokemon/:id` | – | One Pokémon |
| POST | `/pokemon` | – | Add a Pokémon |
| PATCH | `/pokemon/:id` | – | Update a Pokémon |
| DELETE | `/pokemon/:id` | – | Release a Pokémon |
| POST | `/auth/google` | – | Body `{ accessToken }`. Verifies the Google token, creates or finds the user, returns `{ token, user }` (legacy) |
| POST | `/auth/clerk` | – | Body `{ sessionToken }`. Verifies the Clerk session token (needs `CLERK_SECRET_KEY`), creates or finds the user, returns `{ token, user }` |
| GET | `/me` | Bearer | Current user |
| PATCH | `/me` | Bearer | Update `name` or `defaultDifficulty` |
| POST | `/me/games` | Bearer | Record a finished game `{ difficulty, outcome, score, strikes }` |
| GET | `/me/stats` | Bearer | Played, won and best strikes per difficulty |

Protected routes take `Authorization: Bearer <token>`, where the token is the app session token returned by `/auth/google` or `/auth/clerk`.

## Database

Set `MONGODB_URI` in `.env`. The local default is `mongodb://127.0.0.1:27017/pokedex`.
For a hosted cluster, paste its connection string (include the database name).

Collections: `pokemons`, `users`, `gameresults`.

The API still starts when the database is unreachable. Data routes return 503 until it connects.
