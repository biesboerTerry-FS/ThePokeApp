import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DIFFICULTIES,
  createGame,
  getStatus,
  isGameOver,
  hideCards,
  pickCard,
} from './cardMatch.js';

const pool = Array.from({ length: 12 }, (_, i) => ({
  id: String(i + 1),
  name: `Mon ${i + 1}`,
  sprite: `s${i + 1}.png`,
  level: 5,
  types: ['Normal'],
}));

const medium = DIFFICULTIES[1];
const seeded = () => {
  let seed = 7;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
};

function twinsOf(game) {
  const card = game.cards[0];
  const twin = game.cards.find((c) => c.pairId === card.pairId && c.id !== card.id);
  const other = game.cards.find((c) => c.pairId !== card.pairId);
  return { card, twin, other };
}

test('deck has unique card ids and two cards per pair', () => {
  const game = createGame(pool, medium, seeded());
  assert.equal(game.cards.length, medium.pairs * 2);
  assert.equal(new Set(game.cards.map((c) => c.id)).size, game.cards.length);
  const counts = new Map();
  game.cards.forEach((c) => counts.set(c.pairId, (counts.get(c.pairId) ?? 0) + 1));
  assert.ok([...counts.values()].every((n) => n === 2));
});

test('tapping one card reveals only that card, not its twin', () => {
  const game = createGame(pool, medium, seeded());
  const { card, twin } = twinsOf(game);
  const result = pickCard(game, card.id);
  assert.equal(result.action, 'first');
  const flipped = result.game.cards.filter((c) => c.isFlipped).map((c) => c.id);
  assert.deepEqual(flipped, [card.id]);
  assert.equal(result.game.cards.find((c) => c.id === twin.id).isFlipped, false);
});

test('tapping the twin of the first card scores a pair', () => {
  let game = createGame(pool, medium, seeded());
  const { card, twin } = twinsOf(game);
  game = pickCard(game, card.id).game;
  const result = pickCard(game, twin.id);
  assert.equal(result.action, 'match');
  assert.equal(result.game.score, 1);
  assert.equal(result.game.strikes, 0);
  assert.equal(result.game.cards.filter((c) => c.isMatched).length, 2);
});

test('tapping two different pokemon is a strike and locks until hidden', () => {
  let game = createGame(pool, medium, seeded());
  const { card, other } = twinsOf(game);
  game = pickCard(game, card.id).game;
  const result = pickCard(game, other.id);
  assert.equal(result.action, 'mismatch');
  assert.equal(result.game.strikes, 1);
  assert.equal(result.game.score, 0);
  assert.equal(result.game.locked, true);
  assert.deepEqual([...result.mismatchIds].sort(), [card.id, other.id].sort());

  assert.equal(pickCard(result.game, other.id).action, 'ignored');

  const hidden = hideCards(result.game, result.mismatchIds);
  assert.equal(hidden.locked, false);
  assert.ok(hidden.cards.every((c) => !c.isFlipped));
});

test('matched cards cannot be picked again and do not count twice', () => {
  let game = createGame(pool, medium, seeded());
  const { card, twin } = twinsOf(game);
  game = pickCard(game, card.id).game;
  game = pickCard(game, twin.id).game;
  assert.equal(pickCard(game, card.id).action, 'ignored');
  assert.equal(game.score, 1);
});

test('winning and losing are detected from score and strikes', () => {
  const easy = DIFFICULTIES[0];
  const base = createGame(pool, easy, seeded());
  assert.equal(getStatus(base, easy), 'playing');
  assert.equal(getStatus({ ...base, score: easy.pairs }, easy), 'won');
  assert.equal(getStatus({ ...base, strikes: easy.maxStrikes }, easy), 'lost');
  assert.equal(getStatus({ ...base, cards: [] }, easy), 'idle');
});

test('playing a full game with a perfect memory wins', () => {
  let game = createGame(pool, medium, seeded());
  const pairs = new Map();
  game.cards.forEach((c) => pairs.set(c.pairId, [...(pairs.get(c.pairId) ?? []), c.id]));
  for (const [, [a, b]] of pairs) {
    game = pickCard(game, a).game;
    game = pickCard(game, b).game;
  }
  assert.equal(getStatus(game, medium), 'won');
  assert.equal(game.strikes, 0);
});

test('no card can be picked after a loss', () => {
  const easy = DIFFICULTIES[0];
  let game = createGame(pool, easy, seeded());
  game = { ...game, strikes: easy.maxStrikes };
  assert.equal(isGameOver(game), true);
  const unflipped = game.cards.find((c) => !c.isFlipped);
  assert.equal(pickCard(game, unflipped.id).action, 'ignored');
});

test('no card can be picked after a win', () => {
  let game = createGame(pool, medium, seeded());
  game = { ...game, score: medium.pairs };
  assert.equal(isGameOver(game), true);
  const unflipped = game.cards.find((c) => !c.isFlipped);
  assert.equal(pickCard(game, unflipped.id).action, 'ignored');
});

test('a game in progress accepts picks', () => {
  const game = createGame(pool, medium, seeded());
  assert.equal(isGameOver(game), false);
});
