import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { defaultState, loadState, saveState } from '../storage/appStorage';
import { recordResult } from '../game/stats';
import { recordRemoteGame } from '../api/client';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, setState] = useState(defaultState);
  const [ready, setReady] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

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
      setDefaultDifficulty: (key) => update({ defaultDifficulty: key }),
      signIn: (account) =>
        setState((previous) => ({
          ...previous,
          account,
          name: previous.name || account.name,
        })),
      signOut: () => update({ account: null }),
      recordGame: (difficultyKey, outcome, strikes, score) => {
        setState((previous) => ({
          ...previous,
          stats: recordResult(previous.stats, difficultyKey, outcome, strikes),
        }));

        const token = stateRef.current.account?.sessionToken;
        if (token) {
          recordRemoteGame(token, { difficulty: difficultyKey, outcome, strikes, score }).catch(
            () => {}
          );
        }
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
