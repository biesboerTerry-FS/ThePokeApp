const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const GameResult = require('../models/GameResult');
const { requireAuth } = require('../middleware/auth');
const { publicUser } = require('./auth');

const router = express.Router();
const DIFFICULTIES = ['easy', 'medium', 'hard'];

router.use(requireAuth);

async function loadUser(request, response) {
  const user = await User.findById(request.userId);
  if (!user) {
    response.status(401).json({ message: 'Sign in required.' });
    return null;
  }
  return user;
}

router.get('/', async (request, response) => {
  const user = await loadUser(request, response);
  if (user) response.json(publicUser(user));
});

router.patch('/', async (request, response) => {
  const user = await loadUser(request, response);
  if (!user) return;

  const { name, defaultDifficulty } = request.body;

  if (name != null) user.name = String(name).trim().slice(0, 24);
  if (defaultDifficulty != null) {
    if (!DIFFICULTIES.includes(defaultDifficulty)) {
      return response.status(400).json({ message: 'Unknown difficulty.' });
    }
    user.defaultDifficulty = defaultDifficulty;
  }

  await user.save();
  response.json(publicUser(user));
});

router.post('/games', async (request, response) => {
  const { difficulty, outcome, score, strikes } = request.body || {};

  if (!DIFFICULTIES.includes(difficulty) || !['won', 'lost'].includes(outcome)) {
    return response.status(400).json({ message: 'Invalid game result.' });
  }

  const game = await GameResult.create({
    user: request.userId,
    difficulty,
    outcome,
    score: Math.max(0, Number(score) || 0),
    strikes: Math.max(0, Number(strikes) || 0),
  });

  response.status(201).json({ id: String(game._id) });
});

router.get('/stats', async (request, response) => {
  const rows = await GameResult.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(request.userId) } },
    {
      $group: {
        _id: '$difficulty',
        played: { $sum: 1 },
        won: { $sum: { $cond: [{ $eq: ['$outcome', 'won'] }, 1, 0] } },
        bestStrikes: {
          $min: { $cond: [{ $eq: ['$outcome', 'won'] }, '$strikes', null] },
        },
      },
    },
  ]);

  const stats = {};
  for (const row of rows) {
    stats[row._id] = {
      played: row.played,
      won: row.won,
      bestStrikes: row.bestStrikes ?? null,
    };
  }

  response.json(stats);
});

module.exports = router;
