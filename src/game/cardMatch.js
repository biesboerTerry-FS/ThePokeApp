export const DIFFICULTIES = [
  { key: 'easy', label: 'Easy', pairs: 6, maxStrikes: 5 },
  { key: 'medium', label: 'Medium', pairs: 9, maxStrikes: 4 },
  { key: 'hard', label: 'Hard', pairs: 12, maxStrikes: 3 },
];

export function getDifficulty(key) {
  return DIFFICULTIES.find((item) => item.key === key) ?? DIFFICULTIES[1];
}

export function shuffle(array, random = Math.random) {
  const next = [...array];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(random() * (index + 1));
    [next[index], next[randomIndex]] = [next[randomIndex], next[index]];
  }

  return next;
}

export function normalizePokemonList(items) {
  const seen = new Set();

  return items
    .filter((item) => item && (item._id || item.id) && item.sprite)
    .map((item) => ({
      id: String(item._id || item.id),
      name: String(item.name || 'Unknown').replace(/-/g, ' '),
      sprite: item.sprite,
      level: item.level,
      types: Array.isArray(item.types) ? item.types : [],
    }))
    .filter((item) => {
      if (seen.has(item.id)) {
        return false;
      }

      seen.add(item.id);
      return true;
    });
}

// Two cards are neighbours if they share a row and sit side by side, or if
// one sits directly above the other.
export function areNeighbours(a, b, columns) {
  const distance = Math.abs(a - b);
  const sameRow = Math.floor(a / columns) === Math.floor(b / columns);
  return (distance === 1 && sameRow) || distance === columns;
}

export function isSpread(cards, columns) {
  const positions = new Map();

  cards.forEach((card, index) => {
    positions.set(card.pairId, [...(positions.get(card.pairId) ?? []), index]);
  });

  return [...positions.values()].every(([a, b]) => !areNeighbours(a, b, columns));
}

// Each pair shares pairId (the Pokémon id). Card ids are unique per card, so the
// two cards of a pair never collide as React keys or as selection targets.
// The deck is reshuffled until no pair sits next to its twin on the grid.
export function createDeck(pokemonPool, pairCount, random = Math.random, columns = 3) {
  const picked = shuffle(pokemonPool, random).slice(0, pairCount);

  const cards = picked.flatMap((pokemon, index) => [
    {
      ...pokemon,
      id: `${pokemon.id}-a-${index}`,
      pairId: pokemon.id,
      isFlipped: false,
      isMatched: false,
    },
    {
      ...pokemon,
      id: `${pokemon.id}-b-${index}`,
      pairId: pokemon.id,
      isFlipped: false,
      isMatched: false,
    },
  ]);

  let deck = shuffle(cards, random);

  for (let attempt = 0; attempt < 500 && !isSpread(deck, columns); attempt += 1) {
    deck = shuffle(cards, random);
  }

  return deck;
}

export function createGame(pokemonPool, difficulty, random = Math.random, columns = 3) {
  return {
    cards: createDeck(pokemonPool, difficulty.pairs, random, columns),
    pairs: difficulty.pairs,
    maxStrikes: difficulty.maxStrikes,
    firstId: null,
    score: 0,
    strikes: 0,
    locked: false,
  };
}

export function isGameOver(game) {
  return (
    game.cards.length > 0 &&
    (game.score >= game.pairs || game.strikes >= game.maxStrikes)
  );
}

// Applies a tap on a card. Returns the next game state and what happened:
// 'ignored' | 'first' | 'match' | 'mismatch'.
// On 'mismatch' the two ids are returned in `mismatchIds` so the caller can
// flip them back after a delay (and the game stays locked until then).
export function pickCard(game, cardId) {
  const card = game.cards.find((item) => item.id === cardId);

  if (game.locked || isGameOver(game) || !card || card.isFlipped || card.isMatched) {
    return { game, action: 'ignored' };
  }

  const cards = game.cards.map((item) =>
    item.id === cardId ? { ...item, isFlipped: true } : item
  );

  if (!game.firstId) {
    return { game: { ...game, cards, firstId: cardId }, action: 'first' };
  }

  const first = cards.find((item) => item.id === game.firstId);

  if (first.pairId === card.pairId) {
    return {
      game: {
        ...game,
        cards: cards.map((item) =>
          item.pairId === card.pairId ? { ...item, isMatched: true } : item
        ),
        firstId: null,
        score: game.score + 1,
      },
      action: 'match',
    };
  }

  return {
    game: {
      ...game,
      cards,
      firstId: null,
      strikes: game.strikes + 1,
      locked: true,
    },
    action: 'mismatch',
    mismatchIds: [first.id, card.id],
  };
}

export function hideCards(game, ids) {
  return {
    ...game,
    locked: false,
    cards: game.cards.map((item) =>
      ids.includes(item.id) ? { ...item, isFlipped: false } : item
    ),
  };
}

export function getStatus(game) {
  if (game.cards.length === 0) {
    return 'idle';
  }

  if (game.score >= game.pairs) {
    return 'won';
  }

  if (game.strikes >= game.maxStrikes) {
    return 'lost';
  }

  return 'playing';
}
