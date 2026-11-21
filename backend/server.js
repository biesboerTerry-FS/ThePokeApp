require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const mongoose = require('mongoose');
const pokemonRouter = require('./routes/pokemon');
const { demoLogin } = require('./routes/auth');
const { ensureConnected } = require('./db');

const PORT = process.env.PORT || 8000;

const app = express();
// Vercel terminates TLS at the edge, so trust its forwarded-for header for
// per-client rate limiting.
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors());
// Data-URL sprites can be large; cap the body to keep abuse bounded.
app.use(express.json({ limit: '12mb' }));

// Only state-changing calls are throttled. Reads (browse/detail/health) stay
// open and unmetered so the Pokedex never becomes unusable.
const mutationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again later.' },
});

app.use('/api/v1', (request, response, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    return mutationLimiter(request, response, next);
  }
  return next();
});

app.get('/api/v1/health', async (request, response) => {
  let ready = mongoose.connection.readyState === 1;
  if (!ready) {
    try {
      await ensureConnected();
    } catch (error) {
      console.error('Health check could not connect to MongoDB:', error.message);
    }
    ready = mongoose.connection.readyState === 1;
  }
  response.status(ready ? 200 : 503).json({
    status: ready ? 'ok' : 'degraded',
    database: ready ? 'connected' : 'disconnected',
  });
});

app.post('/api/v1/auth/demo', demoLogin);

// Routes below need the database. Answer clearly while it is unreachable.
app.use('/api/v1', async (request, response, next) => {
  if (request.path === '/health' || request.path === '/auth/demo') {
    return next();
  }
  if (mongoose.connection.readyState !== 1) {
    try {
      await ensureConnected();
    } catch (error) {
      console.error('Request could not connect to MongoDB:', error.message);
    }
  }
  if (mongoose.connection.readyState !== 1) {
    return response.status(503).json({ message: 'Database not connected yet.' });
  }
  return next();
});

// Reads are public; POST/PATCH/DELETE require a demo JWT (see routes/auth.js).
// Entries with no ownerId remain shared seed data.
app.use('/api/v1/pokemon', pokemonRouter);

app.use((error, request, response, next) => {
  console.error(error);
  response.status(500).json({ message: 'Something went wrong.' });
});

mongoose.connection.on('connected', () => console.log('Connected to MongoDB'));
mongoose.connection.on('error', (error) => console.error('MongoDB error:', error.message));

// Warm the connection at module load; routes also call ensureConnected() so a
// frozen mid-connect instance can recover on the next invocation.
ensureConnected().catch((error) => {
  console.error('Could not connect to MongoDB:', error.message);
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`Pokédex API listening on http://localhost:${PORT}/api/v1`));
}

module.exports = app;
