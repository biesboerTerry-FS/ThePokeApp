import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigationState } from '@react-navigation/native';

const ITEMS = [
  { label: 'Home', route: 'Home' },
  { label: 'Pokédex', route: 'Dashboard' },
  { label: 'Card Match', route: 'CardMatch' },
  { label: 'Settings', route: 'Settings' },
];

// Compact footer navigation so every main screen links to the same sections.
export default function AppFooterNav({ navigation, dark }) {
  const current = useNavigationState((state) => state.routeNames[state.index]);

  return (
    <View style={[styles.footer, dark && styles.footerDark]}>
      {ITEMS.map((item) => {
        const active = current === item.route;
        return (
          <Pressable
            key={item.route}
            accessibilityRole="button"
            accessibilityLabel={`Go to ${item.label}`}
            accessibilityState={{ selected: active }}
            onPress={() => navigation.navigate(item.route)}
            style={[styles.link, active && styles.linkActive]}
          >
            <Text style={[styles.text, active && styles.textActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 12,
    paddingHorizontal: 12,
    borderTopWidth: 2,
    borderTopColor: '#ffcb05',
    backgroundColor: '#1e3a8a',
  },
  footerDark: {
    backgroundColor: '#0b1220',
  },
  link: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ffcb05',
  },
  linkActive: {
    backgroundColor: '#ffcb05',
  },
  text: {
    color: '#ffcb05',
    fontSize: 12,
    fontWeight: '900',
  },
  textActive: {
    color: '#1e3a8a',
  },
});
