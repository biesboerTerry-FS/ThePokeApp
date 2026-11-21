// Shared screen backgrounds for the persisted light/dark appearance setting.
export const LIGHT_BACKGROUND = '#1e3a8a';
export const DARK_BACKGROUND = '#0b1220';

export const screenBackground = (dark) => (dark ? DARK_BACKGROUND : LIGHT_BACKGROUND);
