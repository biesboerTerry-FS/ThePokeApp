// Replaces the Pokémon collection with the app's bundled roster
// (src/data/pokemonSeed.json, generated from PokeAPI).
require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');
const Pokemon = require('./models/Pokemon');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pokedex';
const SEED_FILE = path.join(__dirname, '..', 'src', 'data', 'pokemonSeed.json');

async function seed() {
  const roster = require(SEED_FILE);

  await mongoose.connect(MONGODB_URI);
  const removed = await Pokemon.deleteMany({});
  const inserted = await Pokemon.insertMany(
    roster.map((pokemon) => ({
      name: pokemon.name,
      types: pokemon.types,
      level: pokemon.level,
      sprite: pokemon.sprite,
    }))
  );

  console.log(`Removed ${removed.deletedCount} Pokémon, inserted ${inserted.length}.`);
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error('Seeding failed:', error.message);
  await mongoose.disconnect();
  process.exit(1);
});
