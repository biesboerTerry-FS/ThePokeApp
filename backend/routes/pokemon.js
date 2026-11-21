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

// The client sends a stable trainer id (userId) from local storage. Entries
// with an empty ownerId are global/shared seed data; entries with an ownerId
// belong to that trainer. Auth is intentionally optional — this is a demo app
// with no real sign-in, so scoping relies on the client-supplied id.
function getOwner(request) {
  const fromQuery = request.query && request.query.userId;
  const fromHeader = request.headers['x-user-id'];
  const fromBody = request.body && request.body.userId;
  return String(fromQuery || fromHeader || fromBody || '').trim();
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

// GET /pokemon?userId=<id> → shared entries + this trainer's entries.
router.get('/', async (request, response) => {
  const owner = getOwner(request);
  const filter = owner ? { ownerId: { $in: ['', owner] } } : { ownerId: '' };
  const pokemon = await Pokemon.find(filter).sort({ name: 1 }).lean();
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
      ownerId: getOwner(request),
    });
    response.status(201).json(withId(pokemon.toObject()));
  } catch (error) {
    response.status(400).json({ message: error.message });
  }
});

router.patch('/:id', loadPokemon, async (request, response) => {
  const pokemon = response.locals.pokemon;
  const owner = getOwner(request);

  // If this entry belongs to a trainer, only that trainer may modify it.
  if (pokemon.ownerId && owner && pokemon.ownerId !== owner) {
    return response.status(403).json({ message: 'Not your Pokémon.' });
  }

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
  const pokemon = response.locals.pokemon;
  const owner = getOwner(request);

  if (pokemon.ownerId && owner && pokemon.ownerId !== owner) {
    return response.status(403).json({ message: 'Not your Pokémon.' });
  }

  await pokemon.deleteOne();
  response.json({ message: 'Deleted Pokémon.' });
});

// The app keys everything on `_id`, so expose it as a string.
function withId(doc) {
  const { __v, ...rest } = doc;
  return { ...rest, _id: String(doc._id) };
}

module.exports = router;
