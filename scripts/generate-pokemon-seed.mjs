// Generates src/data/pokemonSeed.json from PokeAPI.
// Usage: node scripts/generate-pokemon-seed.mjs
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const TOTAL = 1025;
const BATCH = 25;
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/pokemonSeed.json');
const SPRITE = (id) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

// Deterministic PRNG so re-running the script produces the same levels.
function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

async function fetchPokemon(id, attempt = 1) {
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      _id: String(id),
      name: data.name.split('-').map(capitalize).join(' '),
      types: data.types
        .slice()
        .sort((a, b) => a.slot - b.slot)
        .map((t) => capitalize(t.type.name)),
      sprite: data.sprites.front_default || SPRITE(id),
    };
  } catch (error) {
    if (attempt < 3) return fetchPokemon(id, attempt + 1);
    throw new Error(`Failed to fetch #${id}: ${error.message}`);
  }
}

const rand = mulberry32(1025);
const pokemon = [];

for (let start = 1; start <= TOTAL; start += BATCH) {
  const ids = Array.from({ length: Math.min(BATCH, TOTAL - start + 1) }, (_, i) => start + i);
  const batch = await Promise.all(ids.map(fetchPokemon));
  pokemon.push(...batch);
  console.log(`Fetched ${Math.min(start + BATCH - 1, TOTAL)}/${TOTAL}`);
}

pokemon.forEach((p) => {
  p.level = Math.floor(rand() * 50) + 1;
});

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, JSON.stringify(pokemon, null, 2) + '\n');
console.log(`Wrote ${pokemon.length} Pokémon to ${OUT}`);
