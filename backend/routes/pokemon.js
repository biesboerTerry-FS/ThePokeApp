const express = require('express');
const Pokemon = require('../models/Pokemon');
const { requireAuth } = require('./auth');

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
// belong to that trainer. Writes additionally require a demo JWT.
function getOwner(request) {
  const fromQuery = request.query && request.query.userId;
  const fromHeader = request.headers['x-user-id'];
  const fromBody = request.body && request.body.userId;
  return String(fromQuery || fromHeader || fromBody || '').trim();
}

// --- Basic validation for mutation payloads -------------------------------
function invalid(response, message) {
  return response.status(400).json({ message });
}

function validName(value) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 120;
}

function validTypes(value) {
  const types = parseTypes(value);
  return types.length >= 1 && types.length <= 10 && types.every((type) => type.length <= 30)
    ? types
    : null;
}

function validLevel(value) {
  const level = Number(value);
  return Number.isInteger(level) && level >= 1 && level <= 100 ? level : null;
}

// Sprites may be short Cloudinary URLs or data URLs from the image picker.
function validSprite(value) {
  return value == null || (typeof value === 'string' && value.length <= 10_000_000);
}

function validOwner(value) {
  return typeof value === 'string' && value.length <= 200;
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

// GET /pokemon?userId=<id> → shared entries + this trainer's entries. Public.
router.get('/', async (request, response) => {
  const owner = getOwner(request);
  const filter = owner ? { ownerId: { $in: ['', owner] } } : { ownerId: '' };
  const pokemon = await Pokemon.find(filter).sort({ name: 1 }).lean();
  response.json(pokemon.map(withId));
});

// GET /pokemon/:id → public detail lookup.
router.get('/:id', loadPokemon, (request, response) => {
  response.json(withId(response.locals.pokemon.toObject()));
});

// POST /pokemon → requires a demo JWT.
router.post('/', requireAuth, async (request, response) => {
  const body = request.body || {};
  const owner = getOwner(request);

  if (!validName(body.name)) return invalid(response, 'Name is required (1-120 characters).');
  const types = validTypes(body.types);
  if (!types) return invalid(response, 'Provide 1-10 types of at most 30 characters each.');
  const level = validLevel(body.level == null ? 1 : body.level);
  if (level === null) return invalid(response, 'Level must be an integer from 1 to 100.');
  if (!validSprite(body.sprite)) return invalid(response, 'Sprite must be a string.');
  if (!validOwner(owner)) return invalid(response, 'Invalid trainer id.');

  try {
    const pokemon = await Pokemon.create({
      name: body.name.trim(),
      types,
      level,
      sprite: body.sprite || '',
      ownerId: owner,
    });
    response.status(201).json(withId(pokemon.toObject()));
  } catch (error) {
    response.status(400).json({ message: error.message });
  }
});

// PATCH /pokemon/:id → requires a demo JWT.
router.patch('/:id', requireAuth, loadPokemon, async (request, response) => {
  const pokemon = response.locals.pokemon;
  const owner = getOwner(request);
  const body = request.body || {};

  // If this entry belongs to a trainer, only that trainer may modify it.
  if (pokemon.ownerId && owner && pokemon.ownerId !== owner) {
    return response.status(403).json({ message: 'Not your Pokémon.' });
  }

  if (body.name != null && !validName(body.name)) {
    return invalid(response, 'Name must be 1-120 characters.');
  }
  if (body.types != null && !validTypes(body.types)) {
    return invalid(response, 'Provide 1-10 types of at most 30 characters each.');
  }
  if (body.level != null && validLevel(body.level) === null) {
    return invalid(response, 'Level must be an integer from 1 to 100.');
  }
  if (!validSprite(body.sprite)) {
    return invalid(response, 'Sprite must be a string.');
  }

  if (body.name != null) pokemon.name = body.name.trim();
  if (body.sprite != null) pokemon.sprite = body.sprite;
  if (body.level != null) pokemon.level = validLevel(body.level);
  if (body.types != null) pokemon.types = validTypes(body.types);

  try {
    await pokemon.save();
    response.json(withId(pokemon.toObject()));
  } catch (error) {
    response.status(400).json({ message: error.message });
  }
});

// DELETE /pokemon/:id → requires a demo JWT.
router.delete('/:id', requireAuth, loadPokemon, async (request, response) => {
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
