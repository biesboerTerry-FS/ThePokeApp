const mongoose = require('mongoose');

const pokemonSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  types: { type: [String], required: true },
  level: { type: Number, required: true, min: 1, max: 100 },
  sprite: { type: String, default: '' },
  // Stable trainer id from the client. Empty means a global/shared seed entry.
  ownerId: { type: String, default: '', index: true },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Pokemon', pokemonSchema);
