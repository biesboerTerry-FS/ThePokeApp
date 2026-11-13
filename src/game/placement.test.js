import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DIFFICULTIES, areNeighbours, createDeck, isSpread } from './cardMatch.js';

const pool = Array.from({ length: 24 }, (_, i) => ({
  id: String(i + 1),
  name: `Mon ${i + 1}`,
  sprite: `s${i + 1}.png`,
  level: 5,
  types: ['Normal'],
}));

function seededRandom(seed) {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };
}

test('areNeighbours detects side-by-side and stacked cards only', () => {
  assert.equal(areNeighbours(0, 1, 3), true);
  assert.equal(areNeighbours(2, 3, 3), false, 'end of row and start of next row');
  assert.equal(areNeighbours(0, 3, 3), true, 'card directly below');
  assert.equal(areNeighbours(0, 4, 3), false, 'diagonal is allowed');
});

for (const columns of [3, 4, 5]) {
  for (const difficulty of DIFFICULTIES) {
    test(`no twin sits next to its pair: ${difficulty.label}, ${columns} columns`, () => {
      for (let seed = 1; seed <= 200; seed += 1) {
        const deck = createDeck(pool, difficulty.pairs, seededRandom(seed), columns);
        assert.equal(deck.length, difficulty.pairs * 2);
        assert.ok(isSpread(deck, columns), `seed ${seed} placed twins next to each other`);
      }
    });
  }
}
