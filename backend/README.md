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
| GET | `/pokemon` | – | List Pokémon |
| GET | `/pokemon/:id` | – | One Pokémon |
| POST | `/pokemon` | – | Add a Pokémon |
| PATCH | `/pokemon/:id` | – | Update a Pokémon |
| DELETE | `/pokemon/:id` | – | Release a Pokémon |

## Database

Set `MONGODB_URI` in `.env`. The local default is `mongodb://127.0.0.1:27017/pokedex`.
For a hosted cluster, paste its connection string (include the database name).

Collections: `pokemons`.

The API still starts when the database is unreachable. Data routes return 503 until it connects.
