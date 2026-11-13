const mongoose = require('mongoose');

const gameResultSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    outcome: { type: String, enum: ['won', 'lost'], required: true },
    score: { type: Number, required: true, min: 0 },
    strikes: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GameResult', gameResultSchema);
