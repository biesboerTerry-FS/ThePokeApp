import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'pokeapp:state:v1';

export const defaultState = {
  name: '',
  defaultDifficulty: 'medium',
  stats: {},
};

export async function loadState() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultState, ...JSON.parse(raw) } : defaultState;
  } catch (error) {
    return defaultState;
  }
}

export function saveState(state) {
  return AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
