export function recordResult(stats, difficultyKey, outcome, strikes) {
  const current = stats[difficultyKey] ?? { played: 0, won: 0, bestStrikes: null };
  const won = outcome === 'won';

  let bestStrikes = current.bestStrikes;
  if (won) {
    bestStrikes = bestStrikes == null ? strikes : Math.min(bestStrikes, strikes);
  }

  return {
    ...stats,
    [difficultyKey]: {
      played: current.played + 1,
      won: current.won + (won ? 1 : 0),
      bestStrikes,
    },
  };
}

export function winRate(entry) {
  if (!entry || entry.played === 0) {
    return 0;
  }

  return Math.round((entry.won / entry.played) * 100);
}
