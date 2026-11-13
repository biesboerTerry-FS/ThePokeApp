import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DIFFICULTIES } from './cardMatch.js';
import { getBoardLayout } from './boardLayout.js';

const GAP = 10;
const PAD = 12;
const screens = [
  { name: 'phone portrait', width: 393, height: 480 },
  { name: 'phone small', width: 375, height: 420 },
  { name: 'tablet portrait', width: 834, height: 900 },
];

for (const screen of screens) {
  test(`cards fill the width of each row on ${screen.name}`, () => {
    for (const difficulty of DIFFICULTIES) {
      const layout = getBoardLayout({
        width: screen.width,
        height: screen.height,
        count: difficulty.pairs * 2,
        gap: GAP,
        padding: PAD,
      });
      const rowWidth = layout.cardWidth * layout.columns + GAP * (layout.columns - 1);
      assert.ok(rowWidth <= screen.width - PAD * 2, `${difficulty.label} overflows the row`);
      assert.ok(rowWidth >= screen.width - PAD * 2 - layout.columns, `${difficulty.label} leaves a gap at the row end`);
    }
  });

  test(`all cards fit on screen without scrolling on ${screen.name}`, () => {
    for (const difficulty of DIFFICULTIES) {
      const layout = getBoardLayout({
        width: screen.width,
        height: screen.height,
        count: difficulty.pairs * 2,
        gap: GAP,
        padding: PAD,
      });
      assert.equal(layout.fits, true, `${difficulty.label} does not fit`);
      const totalHeight = layout.rows * layout.cardHeight + GAP * (layout.rows - 1);
      assert.ok(totalHeight <= screen.height);
    }
  });

  test(`cards get smaller as difficulty increases on ${screen.name}`, () => {
    const widths = DIFFICULTIES.map((difficulty) =>
      getBoardLayout({
        width: screen.width,
        height: screen.height,
        count: difficulty.pairs * 2,
        gap: GAP,
        padding: PAD,
      }).cardWidth
    );
    for (let i = 1; i < widths.length; i += 1) {
      assert.ok(widths[i] <= widths[i - 1], `widths ${widths.join(', ')} grow with difficulty`);
    }
    assert.ok(widths[0] > widths[widths.length - 1]);
  });
}
