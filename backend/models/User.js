const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    googleId: { type: String, unique: true, sparse: true, index: true },
    clerkId: { type: String, unique: true, sparse: true, index: true },
    name: { type: String, default: '', trim: true, maxlength: 24 },
    email: { type: String, default: '' },
    picture: { type: String, default: '' },
    defaultDifficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
