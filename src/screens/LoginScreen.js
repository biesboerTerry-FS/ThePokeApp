import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PokemonTitle from '../components/PokemonTitle';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { demoLogin } = useAuth();
  const [loading, setLoading] = useState(false);
  const { width } = useWindowDimensions();

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      await demoLogin();
    } catch (error) {
      Alert.alert(
        'Demo login failed',
        error?.message || 'Could not sign in with the demo account.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: width >= 600 ? 40 : 24 },
        ]}
      >
        <View style={styles.card}>
          <PokemonTitle style={styles.title}>thePokêApp</PokemonTitle>
          <Text style={styles.subtitle}>
            Sign in to manage your Pokédex and play Card Match.
          </Text>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Try demo login"
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleDemoLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#d32f2f" />
            ) : (
              <Text style={styles.buttonText}>Try Demo Login</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.hint}>
            No account needed — the demo lets you explore every feature.
          </Text>
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
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    gap: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
    color: '#d32f2f',
  },
  subtitle: {
    fontSize: 16,
    color: '#4b5563',
    textAlign: 'center',
    lineHeight: 24,
  },
  button: {
    width: '100%',
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: '#ffcb05',
    borderWidth: 3,
    borderColor: '#3c5aa6',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#3c5aa6',
    fontSize: 18,
    fontWeight: '900',
  },
  hint: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },
});
