import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const createTokenCache = () => {
  if (Platform.OS === 'web') {
    return {
      getToken: async (key) => {
        try {
          return localStorage.getItem(key);
        } catch {
          return null;
        }
      },
      saveToken: async (key, value) => {
        try {
          localStorage.setItem(key, value);
        } catch {}
      },
    };
  }

  return {
    getToken: async (key) => {
      try {
        return await SecureStore.getItemAsync(key);
      } catch {
        return null;
      }
    },
    saveToken: async (key, value) => {
      try {
        await SecureStore.setItemAsync(key, value);
      } catch {}
    },
  };
};

export const tokenCache = createTokenCache();
