require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const pokemonRouter = require('./routes/pokemon');

const PORT = process.env.PORT || 8000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pokedex';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/v1/health', (request, response) => {
  const ready = mongoose.connection.readyState === 1;
  response.status(ready ? 200 : 503).json({
    status: ready ? 'ok' : 'degraded',
    database: ready ? 'connected' : 'disconnected',
  });
});

// Routes below need the database. Answer clearly while it is unreachable.
app.use('/api/v1', (request, response, next) => {
  if (request.path === '/health' || mongoose.connection.readyState === 1) {
    return next();
  }
  response.status(503).json({ message: 'Database not connected yet.' });
});

app.use('/api/v1/pokemon', pokemonRouter);

app.use((error, request, response, next) => {
  console.error(error);
  response.status(500).json({ message: 'Something went wrong.' });
});

mongoose.connection.on('connected', () => console.log('Connected to MongoDB'));
mongoose.connection.on('error', (error) => console.error('MongoDB error:', error.message));

mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 }).catch((error) => {
  console.error('Could not connect to MongoDB:', error.message);
});

app.listen(PORT, () => console.log(`Pokédex API listening on http://localhost:${PORT}/api/v1`));
