import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getPokemonById,
  getPokemonList,
  updatePokemon,
} from '../api/client';
import { isCloudConfigured, uploadImage } from '../api/cloudinary';
import WebImagePicker from '../components/WebImagePicker';
import { useApp } from '../context/AppContext';
import common from '../styles/common';
import { MAX_CONTENT_WIDTH } from '../styles/layout';
import { mergeCustomPokemon } from '../utils/pokemon';
import { getTypeStyle } from '../utils/typeStyles';

const SLIDE_WIDTH = 120;

export default function PokemonDetailScreen({ route, navigation }) {
  const { width } = useWindowDimensions();
  const id = route.params?.id;
  const {
    userPhotos,
    caught,
    toggleCaught,
    favorites,
    toggleFavorite,
    setPokemonEdit,
    edits,
  } = useApp();

  const [loading, setLoading] = useState(false);
  const [pokemon, setPokemon] = useState(null);
  const [collection, setCollection] = useState([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [notice, setNotice] = useState('');
  const [editValues, setEditValues] = useState({
    name: '',
    types: '',
    level: '',
    sprite: '',
  });

  const carouselRef = useRef(null);
  const photoPickerRef = useRef(null);

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
      // A photo added locally is kept in app state, so it can be opened even
      // though it is not in the backend database yet.
      const localEntry = (userPhotos || []).find(
        (item) => String(item._id ?? item.id) === String(id)
      );
      const remote = localEntry || (await getPokemonById(id));
      // Layer local edits (custom image/name/etc.) over the roster entry so
      // the Pokédex stays whole while still showing the trainer's changes.
      const override = (edits || {})[String(id)];
      const data = override ? { ...remote, ...override } : remote;
      setPokemon(data);
      setEditValues({
        name: data.name,
        types: (data.types || []).join(', '),
        level: String(data.level ?? ''),
        sprite: data.sprite || '',
      });
    } catch (error) {
      Alert.alert('Connection error', `Could not load Pokémon details.`);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [id, navigation, userPhotos, edits]);

  useEffect(() => {
    loadPokemon();
  }, [loadPokemon]);

  const handleUpdate = async () => {
    try {
      const updatedData = {
        ...editValues,
        level: Number(editValues.level) || 1,
        types: editValues.types
          .split(',')
          .map((type) => type.trim())
          .filter(Boolean),
      };
      // Persist locally so edits survive even while the backend is degraded.
      setPokemonEdit(id, updatedData);
      let data = { ...pokemon, ...updatedData };
      try {
        data = await updatePokemon(id, updatedData);
      } catch (error) {
        // Local override is already saved.
      }
      setPokemon(data);
      setNotice('Changes saved.');
    } catch (error) {
      Alert.alert('Error', 'Failed to update Pokémon.');
    }
  };

  const scrollToIndex = useCallback(
    (nextIndex) => {
      if (!carouselItems.length) {
        return;
      }
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
    if (itemId == null || String(itemId) === String(id)) {
      return;
    }
    navigation.setParams({ id: itemId });
  };

  const handleAddPhoto = async (file) => {
    try {
      const result = await uploadImage(file);
      const uri = result?.uri;
      if (!uri) {
        return;
      }

      // Keep the Pokédex whole: the trainer's own image becomes this Pokémon's
      // sprite rather than a new entry. Persist locally so it survives reloads,
      // and best-effort write to the backend when it is available.
      setPokemonEdit(id, { sprite: uri });
      setPokemon((previous) => (previous ? { ...previous, sprite: uri } : previous));
      setEditValues((previous) => ({ ...previous, sprite: uri }));

      try {
        await updatePokemon(id, { sprite: uri });
      } catch (error) {
        // Local override already applied.
      }

      setNotice(
        result.source === 'cloudinary'
          ? 'Image saved to this Pokémon (cloud).'
          : 'Image saved to this Pokémon (on this device).'
      );
      loadCollection();
    } catch (error) {
      setNotice('Could not add your image. Please try again.');
    }
  };

  if (!pokemon) {
    return (
      <SafeAreaView style={common.screen}>
        <View style={[common.content, { flex: 1, justifyContent: 'center' }]}>
          <ActivityIndicator size="large" color="#dc2626" />
        </View>
      </SafeAreaView>
    );
  }

  const activeId = String(pokemon._id ?? pokemon.id ?? id);
  const isCaught = (caught || []).map(String).includes(activeId);
  const isFavorite = (favorites || []).map(String).includes(activeId);

  return (
    <SafeAreaView style={common.screen} edges={['left', 'right', 'bottom']}>
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        contentContainerStyle={[
          common.content,
          { paddingTop: 0, paddingBottom: 8, gap: 8, paddingHorizontal: 10 },
        ]}
      >
        {/* Sprite carousel sits above all of the selected Pokémon's details. */}
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

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Add my photo"
            onPress={() => photoPickerRef.current?.open()}
            style={[common.secondaryButton, styles.addPhotoButton]}
          >
            <Text style={common.buttonText}>Add my photo</Text>
          </TouchableOpacity>
          <WebImagePicker
            ref={photoPickerRef}
            label="Add my photo"
            onPick={handleAddPhoto}
          />
          {notice ? <Text style={styles.notice}>{notice}</Text> : null}
          {isCloudConfigured() ? null : (
            <Text style={styles.notice}>
              Cloud storage is not configured — photos stay on this device.
            </Text>
          )}
        </View>

        <Image accessibilityLabel={`${pokemon.name} sprite`}
          source={{
            uri: pokemon.sprite || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
          }}
          style={{
            width: Math.min(width - 20, 480),
            height: Math.min(width - 20, 480),
            alignSelf: 'center',
            resizeMode: 'contain',
          }}
        />
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
              {isFavorite ? 'Favorite' : 'Favorite'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[common.card, styles.formCard]}>
          <Text style={common.sectionTitle}>Update Pokémon</Text>

          <Text style={[common.title, { fontSize: 24 }]}>{pokemon.name}</Text>
          <Text style={common.subtitle}>Level {pokemon.level}</Text>
          <View
            style={[common.row, { justifyContent: 'center', flexWrap: 'wrap' }]}
          >
            {(pokemon.types || []).map((type) => {
              const style = getTypeStyle(type);
              return (
                <View
                  key={type}
                  style={[
                    common.badge,
                    { backgroundColor: style.backgroundColor },
                  ]}
                >
                  <Text style={[common.badgeText, { color: style.color }]}>
                    {type}
                  </Text>
                </View>
              );
            })}
          </View>

          <Text style={common.label}>Name</Text>
          <TextInput accessibilityLabel="Name"
            style={common.input}
            value={editValues.name}
            onChangeText={(value) =>
              setEditValues({ ...editValues, name: value })
            }
            placeholderTextColor="#64748b"
          />

          <Text style={common.label}>Level</Text>
          <TextInput accessibilityLabel="Level"
            style={common.input}
            value={editValues.level}
            keyboardType="numeric"
            onChangeText={(value) =>
              setEditValues({ ...editValues, level: value })
            }
            placeholderTextColor="#64748b"
          />

          <Text style={common.label}>Types (comma separated)</Text>
          <TextInput accessibilityLabel="Types, comma separated"
            style={common.input}
            value={editValues.types}
            onChangeText={(value) =>
              setEditValues({ ...editValues, types: value })
            }
            placeholderTextColor="#64748b"
          />

          <Text style={common.label}>Sprite Image URL</Text>
          <TextInput accessibilityLabel="Sprite image URL"
            style={common.input}
            value={editValues.sprite}
            onChangeText={(value) =>
              setEditValues({ ...editValues, sprite: value })
            }
            placeholderTextColor="#64748b"
          />

          <View style={[common.row, { marginTop: 16 }]}>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Save changes"
              style={[common.primaryButton, { flex: 1 }]}
              onPress={handleUpdate}
            >
              <Text style={common.buttonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  formCard: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    marginTop: 4,
  },
  toggleRow: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    gap: 10,
    marginTop: 4,
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
  carouselCard: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
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
    lineHeight: 36,
  },
  carouselScroll: {
    flex: 1,
    height: 110,
  },
  carouselContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 2,
  },
  slide: {
    width: SLIDE_WIDTH,
    height: 104,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: 'transparent',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  slideActive: {
    borderColor: '#d32f2f',
    backgroundColor: '#fff8d6',
  },
  slideImage: {
    width: 80,
    height: 72,
  },
  slideName: {
    color: '#1f2937',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    maxWidth: SLIDE_WIDTH - 12,
  },
  carouselCount: {
    alignSelf: 'center',
    color: '#1f2937',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 6,
  },
  addPhotoButton: {
    marginTop: 10,
  },
  notice: {
    color: '#1f2937',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
  },
});
