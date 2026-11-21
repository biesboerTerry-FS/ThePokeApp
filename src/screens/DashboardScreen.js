import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import PokemonTitle from '../components/PokemonTitle';
import { getPokemonList } from '../api/client';
import { useApp } from '../context/AppContext';
import { mergeCustomPokemon } from '../utils/pokemon';
import { getTypeStyle } from '../utils/typeStyles';
import common from '../styles/common';
import { isWide } from '../styles/layout';

const ROWS_PER_PAGE = 15;

export default function DashboardScreen({ navigation }) {
  const { userPhotos } = useApp();
  const [pokemon, setPokemon] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const searchRef = useRef(null);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const columns = width >= 1200 ? 5 : width >= 900 ? 4 : width >= 600 ? 3 : 2;
  const itemsPerPage = columns * ROWS_PER_PAGE;

  const loadPokemon = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPokemonList();
      const list = Array.isArray(data) ? data : data?.data ?? [];
      const cleanedData = (Array.isArray(list) ? list : [])
        .filter(Boolean)
        .map((item) => ({
          ...item,
          name: String(item.name || 'Unknown').replace(/-/g, ' '),
          types: Array.isArray(item.types) ? item.types : [],
        }));
      setPokemon(cleanedData);
    } catch (error) {
      Alert.alert('Connection error', 'Could not reach API.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPokemon();
    }, [loadPokemon])
  );

  // Locally added photos/entries are merged into the cloud-backed list so they
  // appear in the Pokédex immediately, even while the backend is unreachable.
  const allPokemon = useMemo(
    () => mergeCustomPokemon(pokemon, userPhotos),
    [pokemon, userPhotos]
  );

  const filteredPokemon = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return allPokemon.filter((item) =>
      String(item.name || '').toLowerCase().includes(term)
    );
  }, [allPokemon, searchTerm]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPokemon.length / itemsPerPage)
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Pad the last row with empty slots so every row has the same number of cards.
  const currentItems = useMemo(() => {
    const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
    const indexOfLastItem = indexOfFirstItem + itemsPerPage;
    const items = filteredPokemon.slice(indexOfFirstItem, indexOfLastItem);
    const remainder = items.length % columns;
    if (remainder === 0) {
      return items;
    }
    const blanks = Array.from({ length: columns - remainder }, (_, index) => ({
      _id: `blank-${index}`,
      blank: true,
    }));
    return [...items, ...blanks];
  }, [filteredPokemon, currentPage, columns, itemsPerPage]);

  const renderPaginationControls = () => (
    <View
      style={[
        common.row,
        {
          justifyContent: 'space-between',
          marginTop: 0,
          paddingVertical: 0,
          paddingHorizontal: 0,
        },
      ]}
    >
      <Text style={{ fontWeight: '800', color: '#ffffff' }}>
        Results ({filteredPokemon.length})
      </Text>
      <View style={common.row}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Previous page" accessibilityState={{ disabled: currentPage === 1 }}
          style={[
            common.secondaryButton,
            currentPage === 1 && { opacity: 0.45 },
          ]}
          disabled={currentPage === 1}
          onPress={() => setCurrentPage((page) => Math.max(1, page - 1))}
        >
          <Text style={common.buttonText}>Prev</Text>
        </TouchableOpacity>
        <Text style={{ fontWeight: '800', color: '#ffffff' }}>
          {currentPage} / {totalPages}
        </Text>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Next page" accessibilityState={{ disabled: currentPage >= totalPages }}
          style={[
            common.secondaryButton,
            currentPage >= totalPages && { opacity: 0.45 },
          ]}
          disabled={currentPage >= totalPages}
          onPress={() =>
            setCurrentPage((page) => Math.min(totalPages, page + 1))
          }
        >
          <Text style={common.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back"
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.backButton}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        {isWide(width) ? <PokemonTitle style={styles.headerTitle}>Pokédex</PokemonTitle> : null}
        {searchOpen ? (
          <View style={styles.searchWrap}>
            <TextInput
              ref={searchRef}
              autoFocus
              accessibilityLabel="Search Pokémon"
              style={styles.headerSearch}
              value={searchTerm}
              onChangeText={(value) => {
                setSearchTerm(value);
                setCurrentPage(1);
              }}
              onBlur={() => setSearchOpen(false)}
              placeholder="Search Pokémon..."
              placeholderTextColor="#64748b"
              autoCorrect={false}
              returnKeyType="search"
            />
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              onPress={() => {
                setSearchTerm('');
                setCurrentPage(1);
                setSearchOpen(false);
                searchRef.current?.blur?.();
              }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.searchClear}
            >
              <Text style={styles.searchClearText}>×</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Open search"
            onPress={() => setSearchOpen(true)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.searchIconButton}
          >
            <Text style={styles.searchIcon}>🔍</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Add a Pokémon"
          onPress={() => navigation.navigate('AddPokemon')}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.addButton}
        >
          <Text style={styles.addText}>Add</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        key={columns}
        style={styles.list}
        data={loading ? [] : currentItems}
        keyExtractor={(item, index) => String(item._id ?? item.id ?? `${item.name}-${index}`)}
        numColumns={columns}
        columnWrapperStyle={{ gap: 10 }}
        contentContainerStyle={[
          common.content,
          { paddingTop: 10, paddingBottom: 64, gap: 8, paddingHorizontal: 10 },
        ]}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color="#dc2626" />
          ) : (
            <View style={[common.subtleCard, { marginTop: 8 }]}>
              <Text style={common.subtitle}>
                {allPokemon.length === 0
                  ? 'No Pokémon found. Check your connection and try again.'
                  : 'No results match your search.'}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) =>
          item.blank ? (
            <View style={styles.blankSlot} />
          ) : (
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${item.name}, level ${item.level}`} accessibilityHint="Opens details"
            style={styles.pokemonCard}
            onPress={() =>
              navigation.navigate('PokemonDetail', { id: item._id ?? item.id })
            }
          >
            <Image accessible={false}
              source={{
                uri: item.sprite || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
              }}
              style={styles.sprite}
            />
            <Text style={styles.nameText} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.levelText}>Lv. {item.level}</Text>
            <View style={styles.typeRow}>
              {(item.types || []).map((type) => {
                const style = getTypeStyle(type);
                return (
                  <View
                    key={`${item._id ?? item.id}-${type}`}
                    style={[
                      common.badge,
                      styles.typeBadge,
                      { backgroundColor: style.backgroundColor },
                    ]}
                  >
                    <Text
                      style={[
                        common.badgeText,
                        styles.typeBadgeText,
                        { color: style.color },
                      ]}
                    >
                      {type}
                    </Text>
                  </View>
                );
              })}
            </View>
          </TouchableOpacity>
          )
        }
      />

      {!loading && filteredPokemon.length > 0 && (
        <View style={styles.stickyPagination}>
          {renderPaginationControls()}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#d32f2f',
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: 6,
    borderBottomColor: '#333',
  },
  backButton: {
    paddingHorizontal: 4,
  },
  backText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 34,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 3,
  },
  headerSearch: {
    flex: 1,
    minHeight: 44,
    borderRadius: 20,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    color: '#1f2937',
    fontSize: 15,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  searchClear: {
    paddingHorizontal: 6,
    minHeight: 44,
    justifyContent: 'center',
  },
  searchClearText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 26,
  },
  searchIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIcon: {
    fontSize: 18,
    lineHeight: 22,
  },
  addButton: {
    paddingHorizontal: 4,
  },
  addText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  screen: {
    flex: 1,
    backgroundColor: '#1e3a8a',
  },
  list: {
    width: '100%',
  },
  blankSlot: {
    flex: 1,
  },
  pokemonCard: {
    ...common.card,
    flex: 1,
    padding: 10,
  },
  sprite: {
    width: '100%',
    aspectRatio: 1,
    resizeMode: 'contain',
  },
  nameText: {
    fontWeight: '800',
    marginTop: 6,
    color: '#111827',
    fontSize: 13,
  },
  levelText: {
    color: '#4b5563',
    fontSize: 12,
    marginTop: 2,
  },
  typeRow: {
    ...common.row,
    flexWrap: 'wrap',
    marginTop: 6,
    gap: 6,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typeBadgeText: {
    fontSize: 9,
  },
  stickyPagination: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#d32f2f',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
});
