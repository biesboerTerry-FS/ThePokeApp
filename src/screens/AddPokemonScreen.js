import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createPokemon } from '../api/client';
import { useApp } from '../context/AppContext';
import common from '../styles/common';
import { MAX_CONTENT_WIDTH } from '../styles/layout';
import { DARK_BACKGROUND } from '../theme/palette';

const styles = StyleSheet.create({
  formCard: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    marginTop: 4,
  },
});

const emptyPokemon = {
  name: '',
  types: '',
  level: '5',
  sprite: '',
};

export default function AddPokemonScreen({ navigation }) {
  const { userId, darkMode } = useApp();
  const darkScreen = darkMode ? { backgroundColor: DARK_BACKGROUND } : null;
  const [newPokemon, setNewPokemon] = useState(emptyPokemon);

  const handleCreate = async () => {
    if (!newPokemon.name.trim() || !newPokemon.types.trim()) {
      Alert.alert('Validation', 'Name and types are required.');
      return;
    }

    const payload = {
      name: newPokemon.name.trim(),
      types: newPokemon.types
        .split(',')
        .map((type) => type.trim())
        .filter(Boolean),
      level: Number(newPokemon.level) || 1,
      sprite: newPokemon.sprite.trim(),
      // Stable per-device trainer id used to key cloud entries. The current
      // backend model does not have an owner field yet, so it is ignored by
      // MongoDB until the schema is updated.
      userId,
    };

    try {
      await createPokemon(payload);
      setNewPokemon(emptyPokemon);
      Alert.alert('Success', 'New Pokémon added!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create Pokémon.');
    }
  };

  return (
    <SafeAreaView style={[common.screen, darkScreen]} edges={['left', 'right', 'bottom']}>
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        contentContainerStyle={[
          common.content,
          { paddingTop: 0, gap: 8, paddingHorizontal: 10 },
        ]}
      >
        <View style={[common.card, styles.formCard]}>
          <Text style={common.sectionTitle}>Add New Pokémon</Text>
          <Text style={[common.mutedText, { marginTop: 2 }]}>
            Create a new entry for your collection.
          </Text>

          <Text style={common.label}>Name</Text>
          <TextInput accessibilityLabel="Name"
            style={common.input}
            value={newPokemon.name}
            onChangeText={(value) =>
              setNewPokemon({ ...newPokemon, name: value })
            }
            placeholder="Pikachu"
            placeholderTextColor="#64748b"
          />

          <Text style={common.label}>Level</Text>
          <TextInput accessibilityLabel="Level"
            style={common.input}
            value={newPokemon.level}
            onChangeText={(value) =>
              setNewPokemon({ ...newPokemon, level: value })
            }
            keyboardType="numeric"
            placeholder="5"
            placeholderTextColor="#64748b"
          />

          <Text style={common.label}>Types (comma separated)</Text>
          <TextInput accessibilityLabel="Types, comma separated"
            style={common.input}
            value={newPokemon.types}
            onChangeText={(value) =>
              setNewPokemon({ ...newPokemon, types: value })
            }
            placeholder="Electric"
            placeholderTextColor="#64748b"
          />

          <Text style={common.label}>Sprite Image URL</Text>
          <TextInput accessibilityLabel="Sprite image URL"
            style={common.input}
            value={newPokemon.sprite}
            onChangeText={(value) =>
              setNewPokemon({ ...newPokemon, sprite: value })
            }
            placeholder="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png"
            placeholderTextColor="#64748b"
          />

          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Add to Pokédex"
            style={[common.primaryButton, { marginTop: 16 }]}
            onPress={handleCreate}
          >
            <Text style={common.buttonText}>Add to Pokédex</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
