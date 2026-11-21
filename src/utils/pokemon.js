// Combines the API/seed Pokédex with entries the trainer added locally (e.g.
// a photo from their device). Both id and sprite are de-duplicated: the offline
// API fallback can create its own copy of a photo during a session, and we only
// want a single sprite in the carousel/Pokédex.
export function mergeCustomPokemon(base = [], custom = []) {
  const seenIds = new Set();
  const seenSprites = new Set();
  const merged = [];

  for (const item of [...(custom || []), ...(base || [])]) {
    if (!item) {
      continue;
    }
    const id = item._id ?? item.id;
    const sprite = item.sprite;
    if (id != null && seenIds.has(String(id))) {
      continue;
    }
    if (sprite && seenSprites.has(sprite)) {
      continue;
    }
    if (id != null) {
      seenIds.add(String(id));
    }
    if (sprite) {
      seenSprites.add(sprite);
    }
    merged.push(item);
  }

  return merged;
}
