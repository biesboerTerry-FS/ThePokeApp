const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pokedex';

const OPTIONS = {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  retryWrites: true,
  w: 'majority',
};

let pending = null;

async function attempt() {
  try {
    await mongoose.connect(MONGODB_URI, OPTIONS);
  } catch (error) {
    // Leave the connection in a clean state before trying again.
    try {
      await mongoose.disconnect();
    } catch (_) {
      // ignore
    }
    throw error;
  }
}

// Vercel serverless functions can be frozen mid-connect. Retry a few times so
// a cold instance still gets a usable connection when Atlas is intermittently
// reachable from the edge network.
async function connectWithRetry(retries = 2) {
  let lastError;
  for (let i = 0; i <= retries; i += 1) {
    try {
      await attempt();
      return;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function ensureConnected() {
  if (mongoose.connection.readyState === 1) return;
  if (!pending) {
    pending = connectWithRetry().catch((error) => {
      pending = null;
      throw error;
    });
  }
  return pending;
}

module.exports = { ensureConnected, MONGODB_URI };
