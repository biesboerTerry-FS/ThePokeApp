import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getPokemonById, getPokemonList } from '../api/client';
import { useApp } from '../context/AppContext';
import common from '../styles/common';
import { MAX_CONTENT_WIDTH } from '../styles/layout';
import { DARK_BACKGROUND } from '../theme/palette';
import { mergeCustomPokemon } from '../utils/pokemon';
import { getTypeStyle } from '../utils/typeStyles';

const SLIDE_WIDTH = 120;

export default function PokemonDetailScreen({ route, navigation }) {
  const { width } = useWindowDimensions();
  const id = route.params?.id;
  const { userPhotos, caught, toggleCaught, favorites, toggleFavorite, darkMode } = useApp();
  const darkScreen = darkMode ? { backgroundColor: DARK_BACKGROUND } : null;

  const [loading, setLoading] = useState(false);
  const [pokemon, setPokemon] = useState(null);
  const [collection, setCollection] = useState([]);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const carouselRef = useRef(null);

  // The whole collected roster drives the sprite carousel. The backend list is
  // combined with locally saved photo entries (used while Mongo is offline).
  const loadCollection = useCallback(async () => {
    try {
      const data = await getPokemonList();
      const list = Array.isArray(data) ? data : data?.data ?? [];
      setCollection(Array.isArray(list) ? list.filter(Boolean) : []);
    } catch (error) {
      setCollection([]);
    }
  }, []);

  useEffect(() => {
    loadCollection();
  }, [loadCollection]);

  const carouselItems = useMemo(
    () => mergeCustomPokemon(collection, userPhotos),
    [collection, userPhotos]
  );

  const loadPokemon = useCallback(async () => {
    if (id == null) {
      Alert.alert('Error', 'No Pokémon selected.');
      navigation.goBack();
      return;
    }
    setLoading(true);
    try {
      const localEntry = (userPhotos || []).find(
        (item) => String(item._id ?? item.id) === String(id)
      );
      const data = localEntry || (await getPokemonById(id));
      setPokemon(data);
    } catch (error) {
      Alert.alert('Connection error', `Could not load Pokémon details.`);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [id, navigation, userPhotos]);

  useEffect(() => {
    loadPokemon();
  }, [loadPokemon]);

  const scrollToIndex = useCallback(
    (nextIndex) => {
      if (!carouselItems.length) return;
      const clamped = Math.max(0, Math.min(carouselItems.length - 1, nextIndex));
      setCarouselIndex(clamped);
      carouselRef.current?.scrollTo?.({
        x: clamped * (SLIDE_WIDTH + 8),
        animated: true,
      });
    },
    [carouselItems.length]
  );

  const handleCarouselScroll = (event) => {
    const offsetX = event.nativeEvent?.contentOffset?.x ?? 0;
    const index = Math.max(0, Math.round(offsetX / (SLIDE_WIDTH + 8)));
    setCarouselIndex((previous) => (previous === index ? previous : index));
  };

  const selectCarouselItem = (item) => {
    const itemId = item._id ?? item.id;
    if (itemId == null || String(itemId) === String(id)) return;
    navigation.setParams({ id: itemId });
  };

  if (!pokemon) {
    return (
      <SafeAreaView style={[common.screen, darkScreen]}>
        <View style={[common.content, { flex: 1, justifyContent: 'center' }]}>
          <ActivityIndicator size="large" color="#dc2626" />
        </View>
      </SafeAreaView>
    );
  }

  const activeId = String(pokemon._id ?? pokemon.id ?? id);
  const isCaught = (caught || []).map(String).includes(activeId);
  const isFavorite = (favorites || []).map(String).includes(activeId);
  const spriteSize = Math.min(width - 24, 620);

  return (
    <SafeAreaView style={[common.screen, darkScreen]} edges={['left', 'right', 'bottom']}>
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        contentContainerStyle={[
          common.content,
          { paddingTop: 8, paddingBottom: 24, gap: 14, paddingHorizontal: 10 },
        ]}
      >
        {/* Large sprite at the top */}
        <Image
          accessibilityLabel={`${pokemon.name} sprite`}
          source={{
            uri: pokemon.sprite ||
              'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
          }}
          style={{
            width: spriteSize,
            height: spriteSize,
            alignSelf: 'center',
            resizeMode: 'contain',
          }}
        />

        {/* Name / type / level — display only */}
        <View style={[common.card, styles.infoCard, { maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center', width: '100%' }]}>
          <Text style={[common.title, { fontSize: 30 }]}>{pokemon.name}</Text>
          <Text style={[common.subtitle, { fontSize: 18 }]}>Level {pokemon.level}</Text>
          <View style={[common.row, { justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 }]}>
            {(pokemon.types || []).map((type) => {
              const style = getTypeStyle(type);
              return (
                <View key={type} style={[common.badge, { backgroundColor: style.backgroundColor }]}>
                  <Text style={[common.badgeText, { color: style.color }]}>{type}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Catch / Favorite toggles */}
        <View style={[common.row, styles.toggleRow]}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={isCaught ? 'Mark as uncaught' : 'Mark as caught'}
            accessibilityState={{ selected: isCaught }}
            onPress={() => toggleCaught(id)}
            style={[styles.toggleButton, isCaught && styles.caughtActive]}
          >
            <Text style={styles.toggleIcon}>{isCaught ? '✓' : '○'}</Text>
            <Text style={[styles.toggleLabel, isCaught && styles.toggleLabelActive]}>
              {isCaught ? 'Caught' : 'Catch'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            accessibilityState={{ selected: isFavorite }}
            onPress={() => toggleFavorite(id)}
            style={[styles.toggleButton, isFavorite && styles.favoriteActive]}
          >
            <Text style={[styles.toggleIcon, isFavorite && styles.heartIcon]}>
              {isFavorite ? '♥' : '♡'}
            </Text>
            <Text style={[styles.toggleLabel, isFavorite && styles.toggleLabelActive]}>
              Favorite
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sprite carousel below the sprite/details */}
        <View style={[common.card, styles.carouselCard]}>
          <Text style={common.sectionTitle}>Your collection</Text>
          <View style={styles.carouselRow}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Previous sprite"
              onPress={() => scrollToIndex(carouselIndex - 1)}
              accessibilityState={{ disabled: carouselIndex <= 0 }}
              disabled={carouselIndex <= 0}
              style={[styles.arrow, carouselIndex <= 0 && styles.arrowDisabled]}
            >
              <Text style={styles.arrowText}>‹</Text>
            </TouchableOpacity>

            <ScrollView
              ref={carouselRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={handleCarouselScroll}
              style={styles.carouselScroll}
              contentContainerStyle={styles.carouselContent}
            >
              {carouselItems.map((item) => {
                const itemId = item._id ?? item.id;
                const active = String(itemId) === activeId;
                return (
                  <TouchableOpacity
                    key={String(itemId ?? item.name ?? item.sprite)}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.name} sprite`}
                    onPress={() => selectCarouselItem(item)}
                    style={[styles.slide, active && styles.slideActive]}
                  >
                    <Image
                      accessible={false}
                      source={{
                        uri: item.sprite ||
                          'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
                      }}
                      style={styles.slideImage}
                      resizeMode="contain"
                    />
                    <Text style={styles.slideName} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Next sprite"
              onPress={() => scrollToIndex(carouselIndex + 1)}
              accessibilityState={{
                disabled: carouselIndex >= carouselItems.length - 1,
              }}
              disabled={carouselIndex >= carouselItems.length - 1}
              style={[
                styles.arrow,
                carouselIndex >= carouselItems.length - 1 && styles.arrowDisabled,
              ]}
            >
              <Text style={styles.arrowText}>›</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.carouselCount}>
            {Math.min(carouselIndex + 1, carouselItems.length)} / {carouselItems.length}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  infoCard: {
    backgroundColor: 'rgba(255, 203, 5, 0.55)',
  },
  carouselCard: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 203, 5, 0.55)',
  },
  toggleRow: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    gap: 10,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#1e3a8a',
  },
  caughtActive: {
    backgroundColor: '#d32f2f',
    borderColor: '#d32f2f',
  },
  favoriteActive: {
    backgroundColor: '#d32f2f',
    borderColor: '#d32f2f',
  },
  toggleIcon: {
    color: '#1e3a8a',
    fontSize: 18,
    fontWeight: '900',
  },
  heartIcon: {
    color: '#ffffff',
  },
  toggleLabel: {
    color: '#1e3a8a',
    fontWeight: '900',
    fontSize: 14,
  },
  toggleLabelActive: {
    color: '#ffffff',
  },
  carouselRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  arrow: {
    width: 40,
    height: 96,
    borderRadius: 12,
    backgroundColor: '#1e3a8a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowDisabled: {
    opacity: 0.4,
  },
  arrowText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '900',
  },
  carouselScroll: {
    flex: 1,
  },
  carouselContent: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 2,
  },
  slide: {
    width: SLIDE_WIDTH,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 12,
  },
  slideActive: {
    backgroundColor: 'rgba(30, 58, 138, 0.18)',
  },
  slideImage: {
    width: 84,
    height: 84,
    resizeMode: 'contain',
  },
  slideName: {
    color: '#1f2937',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    width: SLIDE_WIDTH - 8,
  },
  carouselCount: {
    color: '#1f2937',
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 6,
  },
});
