import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useApp } from '../context/AppContext';

// Small, high-contrast appearance toggle; the value is persisted with app state.
export default function ThemeToggle() {
  const { darkMode, setDarkMode } = useApp();
  const dark = Boolean(darkMode);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      accessibilityState={{ checked: dark }}
      onPress={() => setDarkMode(!dark)}
      style={styles.button}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Text style={styles.icon}>{dark ? '☀' : '☾'}</Text>
      <Text style={styles.label}>{dark ? 'Light mode' : 'Dark mode'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#d32f2f',
    borderWidth: 2,
    borderColor: '#ffcb05',
  },
  icon: {
    color: '#ffcb05',
    fontSize: 18,
    fontWeight: '900',
  },
  label: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
});
