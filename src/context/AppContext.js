import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { defaultState, loadState, saveState } from '../storage/appStorage';
import { recordResult } from '../game/stats';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, setState] = useState(defaultState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadState().then((loaded) => {
      setState(loaded);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (ready) {
      saveState(state).catch(() => {});
    }
  }, [ready, state]);

  const update = useCallback((patch) => {
    setState((previous) => ({ ...previous, ...patch }));
  }, []);

  const actions = useMemo(
    () => ({
      setName: (name) => update({ name }),
      setAvatar: (uri) => update({ avatar: uri || '' }),
      setDefaultDifficulty: (key) => update({ defaultDifficulty: key }),
      addUserPhoto: (entry) =>
        setState((previous) => ({
          ...previous,
          userPhotos: [entry, ...(previous.userPhotos || [])],
        })),
      recordGame: (difficultyKey, outcome, strikes) => {
        setState((previous) => ({
          ...previous,
          stats: recordResult(previous.stats, difficultyKey, outcome, strikes),
        }));
      },
      resetStats: () => update({ stats: {} }),
    }),
    [update]
  );

  const value = useMemo(
    () => ({ ...state, ready, ...actions }),
    [state, ready, actions]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }

  return context;
}
