const express = require('express');
const Pokemon = require('../models/Pokemon');

const router = express.Router();

function parseTypes(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

async function loadPokemon(request, response, next) {
  try {
    const pokemon = await Pokemon.findById(request.params.id);

    if (!pokemon) {
      return response.status(404).json({ message: 'Pokémon not found.' });
    }

    response.locals.pokemon = pokemon;
    next();
  } catch (error) {
    response.status(400).json({ message: 'Invalid Pokémon id.' });
  }
}

router.get('/', async (request, response) => {
  const pokemon = await Pokemon.find().sort({ name: 1 }).lean();
  response.json(pokemon.map(withId));
});

router.get('/:id', loadPokemon, (request, response) => {
  response.json(withId(response.locals.pokemon.toObject()));
});

router.post('/', async (request, response) => {
  try {
    const pokemon = await Pokemon.create({
      name: request.body.name,
      types: parseTypes(request.body.types),
      level: Number(request.body.level) || 1,
      sprite: request.body.sprite || '',
    });
    response.status(201).json(withId(pokemon.toObject()));
  } catch (error) {
    response.status(400).json({ message: error.message });
  }
});

router.patch('/:id', loadPokemon, async (request, response) => {
  const pokemon = response.locals.pokemon;
  const { name, sprite, level, types } = request.body;

  if (name != null) pokemon.name = name;
  if (sprite != null) pokemon.sprite = sprite;
  if (level != null) pokemon.level = Number(level);
  if (types != null) pokemon.types = parseTypes(types);

  try {
    await pokemon.save();
    response.json(withId(pokemon.toObject()));
  } catch (error) {
    response.status(400).json({ message: error.message });
  }
});

router.delete('/:id', loadPokemon, async (request, response) => {
  await response.locals.pokemon.deleteOne();
  response.json({ message: 'Deleted Pokémon.' });
});

// The app keys everything on `_id`, so expose it as a string.
function withId(doc) {
  const { __v, ...rest } = doc;
  return { ...rest, _id: String(doc._id) };
}

module.exports = router;
