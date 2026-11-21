import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PokemonTitle from '../components/PokemonTitle';
import { useApp } from '../context/AppContext';
import { MAX_CONTENT_WIDTH, actionButton, isWide } from '../styles/layout';

export default function HomeScreen({ navigation }) {
  const { name, setName } = useApp();
  const { width } = useWindowDimensions();
  const wide = isWide(width);
  const signedIn = Boolean(name.trim());
  const displayName = signedIn ? name.trim() : 'Trainer';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <PokemonTitle style={styles.headerTitle}>thePokêApp</PokemonTitle>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Settings"
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.settingsGear}>⚙</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Image
          accessibilityRole="image"
          accessibilityLabel="Pokédex Master banner"
          source={require('../../assets/banner.png')}
          style={[styles.banner, { width, height: (width * 1148) / 3320 }]}
          resizeMode="cover"
        />
        <View style={styles.column}>
          <PokemonTitle accessibilityRole="header" style={styles.heading}>
            Welcome, {displayName}!
          </PokemonTitle>
          <Text style={styles.description}>
            Organize your collection, track levels, manage sprites, and play the interactive Card Match game.
          </Text>

          {/* Once a trainer name is set the user is "signed in" — no need to
              ask for it again here. It stays editable in Settings. */}
          {signedIn ? null : (
            <View style={styles.field}>
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
            </View>
          )}

        </View>

        <View style={[styles.actionsWrap, wide && styles.actionsWrapWide]}>
          <View style={[styles.actions, wide && styles.actionsWide]}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Enter Pokédex"
              style={[styles.action, styles.primaryAction, wide && styles.actionSlotWide]}
              onPress={() => navigation.navigate('Dashboard')}
            >
              <Text style={styles.actionText}>Enter Pokédex</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Play Card Match"
              style={[styles.action, styles.secondaryAction, wide && styles.actionSlotWide]}
              onPress={() => navigation.navigate('CardMatch')}
            >
              <Text style={styles.actionText}>Play Card Match</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e3a8a',
  },
  header: {
    backgroundColor: '#d32f2f',
    minHeight: 110,
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 36,
    marginTop: 30,
    fontWeight: '900',
    letterSpacing: 4,
    textAlign: 'center',
  },
  settingsButton: {
    position: 'absolute',
    right: 18,
    bottom: 14,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsGear: {
    color: '#ffffff',
    fontSize: 30,
    lineHeight: 32,
    fontWeight: '800',
  },
  content: {
    flexGrow: 1,
    paddingBottom: 40,
    alignItems: 'center',
    backgroundColor: '#1e3a8a',
  },
  banner: {
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderColor: '#ffffff',
  },
  // One width for everything under the banner: text, field and buttons.
  column: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    paddingHorizontal: 20,
    paddingTop: 30,
    alignItems: 'center',
  },
  heading: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#e6eeff',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  field: {
    width: '100%',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    minHeight: 56,
    borderWidth: 2,
    borderColor: '#2196f3',
    borderRadius: 28,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    color: '#333',
    fontSize: 16,
  },
  actionsWrap: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    paddingHorizontal: 20,
    marginTop: 'auto',
    paddingTop: 24,
  },
  actionsWrapWide: {
    marginTop: 24,
    paddingTop: 0,
  },
  actions: {
    width: '100%',
    gap: 14,
  },
  actionsWide: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionSlot: {
    width: '100%',
  },
  actionSlotWide: {
    flex: 1,
    width: 'auto',
  },
  action: {
    ...actionButton,
    width: '100%',
    maxWidth: 280,
    alignSelf: 'center',
  },
  primaryAction: {
    backgroundColor: '#d32f2f',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  secondaryAction: {
    backgroundColor: '#3c5aa6',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  actionText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 16,
    textAlign: 'center',
  },
});
