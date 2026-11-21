import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'pokeapp:state:v1';

export const defaultState = {
  name: '',
  avatar: '',
  defaultDifficulty: 'medium',
  // Persisted appearance preference (light = classic Pokédex blue, dark = near-black).
  darkMode: false,
  stats: {},
  // Locally added Pokédex entries (including user photos). When the backend is
  // healthy these are also written to MongoDB via the existing API; this local
  // copy keeps the demo usable (and the carousel populated) while the cloud
  // database is being configured.
  userPhotos: [],
  // Pokemon ids the trainer has marked as caught (Pokémon GO style).
  caught: [],
  // Pokemon ids the trainer has favorited (heart).
  favorites: [],
  // Per-Pokemon local overrides (name/level/types/sprite) so the roster stays
  // whole while still allowing a trainer to add their own image and edit.
  edits: {},
  // Stable identifier used to key cloud entries by trainer. The backend's
  // Pokemon model has no owner field yet, so today this is sent with create
  // calls and stored on local entries; see CLOUD_STORAGE_SETUP.md.
  userId: '',
};

function createUserId() {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return `trainer-${crypto.randomUUID()}`;
    }
  } catch (error) {
    // Fall through to the timestamp-based id.
  }
  return `trainer-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function loadState() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const loaded = raw ? { ...defaultState, ...JSON.parse(raw) } : { ...defaultState };
    if (!loaded.userId) {
      loaded.userId = createUserId();
    }
    return loaded;
  } catch (error) {
    return { ...defaultState, userId: createUserId() };
  }
}

export function saveState(state) {
  return AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
