import React, { useCallback, useEffect, useState } from 'react';
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
  deletePokemon,
  getPokemonById,
  updatePokemon,
} from '../api/client';
import common from '../styles/common';
import { MAX_CONTENT_WIDTH } from '../styles/layout';
import { getTypeStyle } from '../utils/typeStyles';

const styles = StyleSheet.create({
  formCard: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    marginTop: 4,
  },
});

export default function PokemonDetailScreen({ route, navigation }) {
  const { width } = useWindowDimensions();
  const id = route.params?.id;
  const [loading, setLoading] = useState(false);
  const [pokemon, setPokemon] = useState(null);
  const [editValues, setEditValues] = useState({
    name: '',
    types: '',
    level: '',
    sprite: '',
  });

  const loadPokemon = useCallback(async () => {
    if (id == null) {
      Alert.alert('Error', 'No Pokémon selected.');
      navigation.goBack();
      return;
    }
    setLoading(true);
    try {
      const data = await getPokemonById(id);
      setPokemon(data);
      setEditValues({
        name: data.name,
        types: (data.types || []).join(', '),
        level: String(data.level ?? ''),
        sprite: data.sprite || '',
      });
    } catch (error) {
      Alert.alert(
        'Connection error',
        `Could not load Pokémon details.`
      );
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [id, navigation]);

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
      const data = await updatePokemon(id, updatedData);
      setPokemon(data);
      Alert.alert('Success', 'Pokémon updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update Pokémon.');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Release Pokémon',
      'Are you sure you want to release this Pokémon?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Release',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePokemon(id);
              navigation.goBack();
            } catch (error) {
              Alert.alert(
                'Error',
                'Failed to delete Pokémon.'
              );
            }
          },
        },
      ]
    );
  };

  if (loading || !pokemon) {
    return (
      <SafeAreaView style={common.screen}>
        <View style={[common.content, { flex: 1, justifyContent: 'center' }]}>
          <ActivityIndicator size="large" color="#dc2626" />
        </View>
      </SafeAreaView>
    );
  }

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
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Release Pokémon"
              style={[
                common.secondaryButton,
                { flex: 1, backgroundColor: '#991b1b' },
              ]}
              onPress={handleDelete}
            >
              <Text style={common.buttonText}>Release</Text>
            </TouchableOpacity>
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
