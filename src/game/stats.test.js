import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recordResult, winRate } from './stats.js';

test('a win increments played and won and keeps the lowest strike count', () => {
  let stats = recordResult({}, 'easy', 'won', 3);
  stats = recordResult(stats, 'easy', 'won', 1);
  stats = recordResult(stats, 'easy', 'won', 4);
  assert.deepEqual(stats.easy, { played: 3, won: 3, bestStrikes: 1 });
});

test('a loss counts as played without changing best strikes', () => {
  let stats = recordResult({}, 'hard', 'won', 2);
  stats = recordResult(stats, 'hard', 'lost', 3);
  assert.deepEqual(stats.hard, { played: 2, won: 1, bestStrikes: 2 });
});

test('difficulties are tracked separately', () => {
  const stats = recordResult(recordResult({}, 'easy', 'won', 0), 'medium', 'lost', 4);
  assert.equal(stats.easy.won, 1);
  assert.equal(stats.medium.won, 0);
});

test('win rate is a rounded percentage', () => {
  assert.equal(winRate(undefined), 0);
  assert.equal(winRate({ played: 3, won: 2, bestStrikes: 1 }), 67);
});
