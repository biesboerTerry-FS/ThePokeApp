export const CARD_RATIO = 1.4;

// Picks the grid that gives the largest cards while every card still fits in
// the space. Rows always fill the width before a new row starts. If nothing
// fits the height, the board scrolls and a comfortable width-filling size is used.
export function getBoardLayout({ width, height, count, gap, padding, minCardWidth = 48 }) {
  const boardWidth = Math.max(0, width - padding * 2);
  let best = null;
  let fallback = null;

  for (let columns = 1; columns <= count; columns += 1) {
    const cardWidth = Math.floor((boardWidth - gap * (columns - 1)) / columns);

    if (cardWidth < minCardWidth) {
      break;
    }

    const cardHeight = Math.floor(cardWidth * CARD_RATIO);
    const rows = Math.ceil(count / columns);
    const totalHeight = rows * cardHeight + gap * (rows - 1);
    const candidate = { columns, cardWidth, cardHeight, rows, fits: totalHeight <= height };

    if (candidate.fits && (!best || cardWidth > best.cardWidth)) {
      best = candidate;
    }

    if (cardWidth <= 140 && (!fallback || cardWidth > fallback.cardWidth)) {
      fallback = candidate;
    }
  }

  return best ?? fallback ?? { columns: 1, cardWidth: minCardWidth, cardHeight: Math.floor(minCardWidth * CARD_RATIO), rows: count, fits: false };
}
