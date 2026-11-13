import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const OUTLINE_COLOR = '#2a75bb';
const FILL_COLOR = '#ffcb05';
const RADIUS = 2;
const OFFSETS = [
  [-RADIUS, 0],
  [RADIUS, 0],
  [0, -RADIUS],
  [0, RADIUS],
  [-RADIUS, -RADIUS],
  [RADIUS, -RADIUS],
  [-RADIUS, RADIUS],
  [RADIUS, RADIUS],
];

// Renders text in the Pokémon font with a yellow fill and blue outline by
// stacking offset copies behind the main glyphs (cross-platform).
export default function PokemonTitle({
  children,
  style,
  color = FILL_COLOR,
  outlineColor = OUTLINE_COLOR,
  accessibilityRole,
  numberOfLines,
  allowFontScaling,
}) {
  const flat = StyleSheet.flatten(style) || {};
  const base = {
    ...flat,
    fontFamily: 'PokemonSolid',
    textShadowColor: '#000000',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  };
  // Outline layers share layout but render no visible fill of their own.
  const outlineStyle = {
    ...base,
    color: outlineColor,
  };

  return (
    <View style={styles.wrap} accessible={false}>
      {OFFSETS.map(([dx, dy], index) => (
        <Text
          key={index}
          aria-hidden={true}
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden={true}
          numberOfLines={numberOfLines}
          allowFontScaling={allowFontScaling}
          style={[
            outlineStyle,
            styles.outline,
            { transform: [{ translateX: dx }, { translateY: dy }] },
          ]}
        >
          {children}
        </Text>
      ))}
      <Text
        accessibilityRole={accessibilityRole}
        numberOfLines={numberOfLines}
        allowFontScaling={allowFontScaling}
        style={[base, { color }]}
      >
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  outline: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
});
