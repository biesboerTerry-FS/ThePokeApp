import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from '../api/client';
import { setAuthToken, clearAuthToken } from '../api/token';

const TOKEN_KEY = '@pokeapp:token';
const USER_KEY = '@pokeapp:user';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.multiGet([TOKEN_KEY, USER_KEY])
      .then(([tokenEntry, userEntry]) => {
        const storedToken = tokenEntry[1];
        const storedUser = userEntry[1];
        if (storedToken) {
          setToken(storedToken);
          setAuthToken(storedToken);
        }
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            setUser(null);
          }
        }
      })
      .finally(() => setReady(true));
  }, []);

  const login = useCallback(async (tokenValue, userValue) => {
    setToken(tokenValue);
    setUser(userValue);
    setAuthToken(tokenValue);
    await AsyncStorage.multiSet([
      [TOKEN_KEY, tokenValue],
      [USER_KEY, JSON.stringify(userValue)],
    ]);
  }, []);

  const logout = useCallback(async () => {
    setToken(null);
    setUser(null);
    clearAuthToken();
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  }, []);

  const demoLogin = useCallback(async () => {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/auth/demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Demo login failed.');
    }

    const data = await response.json();
    await login(data.token, data.user);
    return data;
  }, [login]);

  const value = useMemo(
    () => ({
      token,
      user,
      ready,
      isAuthenticated: Boolean(token),
      login,
      logout,
      demoLogin,
    }),
    [token, user, ready, login, logout, demoLogin]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
