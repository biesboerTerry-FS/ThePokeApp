// Shared layout rules so every screen uses the same breakpoints and widths.
export const WIDE_BREAKPOINT = 700;
export const MAX_CONTENT_WIDTH = 720;

export const isWide = (width) => width >= WIDE_BREAKPOINT;

// Base look for full-width action buttons. Use with flex: 1 on wide screens so
// buttons in a row share the same width and height.
export const ACTION_BUTTON_HEIGHT = 56;

export const actionButton = {
  minHeight: ACTION_BUTTON_HEIGHT,
  borderRadius: 28,
  paddingVertical: 14,
  paddingHorizontal: 20,
  alignItems: 'center',
  justifyContent: 'center',
};
