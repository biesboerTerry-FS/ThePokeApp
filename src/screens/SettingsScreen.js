import React, { useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WebImagePicker from '../components/WebImagePicker';
import { isCloudConfigured, uploadImage } from '../api/cloudinary';
import { useApp } from '../context/AppContext';
import { DIFFICULTIES } from '../game/cardMatch';
import { winRate } from '../game/stats';
import { MAX_CONTENT_WIDTH } from '../styles/layout';

function initialsOf(name) {
  return (
    String(name || 'T')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'T'
  );
}

export default function SettingsScreen() {
  const {
    name,
    avatar,
    defaultDifficulty,
    stats,
    setName,
    setAvatar,
    setDefaultDifficulty,
    resetStats,
  } = useApp();
  const pickerRef = useRef(null);
  const [confirmReset, setConfirmReset] = useState(false);

  function handleResetStats() {
    // Alert.alert is a no-op on the web build, so use an inline two-step
    // confirmation that works everywhere.
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    resetStats();
    setConfirmReset(false);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.profileRow}>
            {avatar ? (
              <Image
                accessibilityRole="image"
                accessibilityLabel="Profile avatar"
                source={{ uri: avatar }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarText}>{initialsOf(name)}</Text>
              </View>
            )}
            <View style={styles.profileText}>
              <Text style={styles.cardTitle}>{name.trim() || 'Trainer'}</Text>
              <Text style={styles.muted}>Local player profile</Text>
            </View>
          </View>

          <Text style={styles.label}>Trainer name</Text>
          <TextInput accessibilityLabel="Trainer name"
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor="#64748b"
            maxLength={24}
            autoCorrect={false}
          />

          <Text style={styles.label}>Avatar</Text>
          <View style={styles.avatarActions}>
            <Pressable accessibilityRole="button" accessibilityLabel="Update avatar"
              onPress={() => pickerRef.current?.open()}
              style={styles.avatarButton}
            >
              <Text style={styles.avatarButtonText}>
                {avatar ? 'Change avatar' : 'Update avatar'}
              </Text>
            </Pressable>
            {avatar ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Clear avatar"
                onPress={() => setAvatar('')}
                style={[styles.avatarButton, styles.avatarClearButton]}
              >
                <Text style={styles.avatarButtonText}>Clear</Text>
              </Pressable>
            ) : null}
          </View>
          <WebImagePicker
            ref={pickerRef}
            label="Update avatar"
            onPick={async (file) => {
              const result = await uploadImage(file);
              if (result?.uri) {
                setAvatar(result.uri);
              }
            }}
          />
          {isCloudConfigured() ? null : (
            <Text style={styles.muted}>
              Cloud storage is not configured yet — images are saved on this device.
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Difficulty</Text>
          <Text style={styles.muted}>Used when you open Card Match.</Text>
          <View style={styles.chipRow}>
            {DIFFICULTIES.map((item) => {
              const active = item.key === defaultDifficulty;
              return (
                <Pressable accessibilityRole="button" accessibilityLabel={`${item.label} difficulty`} accessibilityState={{ selected: active }}
                  key={item.key}
                  onPress={() => setDefaultDifficulty(item.key)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Card Match stats</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.cell, styles.cellLabel, styles.headerText]}>Level</Text>
            <Text style={[styles.cell, styles.headerText]}>Played</Text>
            <Text style={[styles.cell, styles.headerText]}>Won</Text>
            <Text style={[styles.cell, styles.headerText]}>Win %</Text>
            <Text style={[styles.cell, styles.headerText]}>Best strikes</Text>
          </View>
          {DIFFICULTIES.map((item) => {
            const entry = stats[item.key];
            return (
              <View key={item.key} style={styles.tableRow}>
                <Text style={[styles.cell, styles.cellLabel]}>{item.label}</Text>
                <Text style={styles.cell}>{entry?.played ?? 0}</Text>
                <Text style={styles.cell}>{entry?.won ?? 0}</Text>
                <Text style={styles.cell}>{winRate(entry)}%</Text>
                <Text style={styles.cell}>{entry?.bestStrikes ?? '–'}</Text>
              </View>
            );
          })}
          <Pressable accessibilityRole="button" accessibilityLabel="Reset Card Match stats" onPress={handleResetStats} style={[styles.dangerButton, confirmReset && styles.confirmResetButton]}>
            <Text style={styles.dangerText}>{confirmReset ? 'Tap again to confirm' : 'Reset stats'}</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>About</Text>
          <Text style={styles.muted}>Pokédex Master · version 1.0.0</Text>
          <Text style={styles.muted}>
            Pokémon data is cached on this device so the Pokédex works offline.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#1e3a8a',
  },
  content: {
    padding: 14,
    gap: 14,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    backgroundColor: '#ffcb05',
    borderRadius: 20,
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarFallback: {
    backgroundColor: '#1e3a8a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
  },
  avatarActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  avatarButton: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#1e3a8a',
  },
  avatarClearButton: {
    backgroundColor: '#991b1b',
  },
  avatarButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  profileText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1f2937',
  },
  muted: {
    color: '#4b5563',
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1f2937',
    marginTop: 4,
  },
  input: {
    borderWidth: 2,
    borderColor: '#2196f3',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    color: '#333',
    fontSize: 16,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  chip: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#1e3a8a',
  },
  chipActive: {
    backgroundColor: '#1e3a8a',
  },
  chipText: {
    color: '#1e3a8a',
    fontWeight: '800',
    fontSize: 13,
  },
  chipTextActive: {
    color: '#ffffff',
  },
  tableHeader: {
    flexDirection: 'row',
    marginTop: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#1f2937',
    paddingBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#d6b656',
  },
  cell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: '#1f2937',
  },
  cellLabel: {
    textAlign: 'left',
  },
  headerText: {
    fontWeight: '900',
  },
  confirmResetButton: {
    backgroundColor: '#dc2626',
  },
  dangerButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
    backgroundColor: '#991b1b',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  dangerText: {
    color: '#ffffff',
    fontWeight: '800',
  },
});
