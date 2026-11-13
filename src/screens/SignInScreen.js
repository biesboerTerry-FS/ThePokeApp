import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useSSO } from '@clerk/expo';
import { isClerkConfigured } from '../auth/clerk';

WebBrowser.maybeCompleteAuthSession();

const PROVIDERS = [
  { strategy: 'oauth_google', label: 'Continue with Google' },
  { strategy: 'oauth_github', label: 'Continue with GitHub' },
  { strategy: 'oauth_apple', label: 'Continue with Apple' },
  { strategy: 'oauth_discord', label: 'Continue with Discord' },
];

function ConfiguredSignInScreen({ navigation }) {
  const { startSSOFlow } = useSSO();
  const [busy, setBusy] = useState(null);
  const [message, setMessage] = useState('');

  const onPress = useCallback(
    async (strategy) => {
      setBusy(strategy);
      setMessage('');
      try {
        const { createdSessionId, setActive } = await startSSOFlow({
          strategy,
          redirectUrl: Linking.createURL('/sso-callback', { scheme: 'thepokeapp' }),
        });

        if (createdSessionId && setActive) {
          await setActive({ session: createdSessionId });
          navigation.goBack();
        }
      } catch (error) {
        const msg = error?.errors?.[0]?.message || error?.message || 'Could not sign in.';
        // User cancelled is not an error worth showing loudly
        if (!/cancel/i.test(msg)) {
          setMessage(msg);
        }
      } finally {
        setBusy(null);
      }
    },
    [navigation, startSSOFlow]
  );

  return (
    <SignInLayout message={message}>
      <View style={styles.buttons}>
        {PROVIDERS.map((provider) => {
          const isBusy = busy === provider.strategy;
          return (
            <Pressable
              key={provider.strategy}
              accessibilityRole="button"
              accessibilityLabel={provider.label}
              accessibilityState={{ busy: isBusy, disabled: !!busy }}
              onPress={() => onPress(provider.strategy)}
              disabled={!!busy}
              style={[styles.button, busy && !isBusy && styles.dimmed]}
            >
              {isBusy ? (
                <ActivityIndicator color="#1f2937" />
              ) : (
                <Text style={styles.buttonText}>{provider.label}</Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </SignInLayout>
  );
}

function UnconfiguredSignInScreen() {
  return (
    <SignInLayout
      notice="Sign-in is not set up yet. Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to .env and restart Expo."
    />
  );
}

function SignInLayout({ children, notice, message }) {
  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.title}>
            Sign in
          </Text>
          <Text style={styles.subtitle}>Choose a provider to continue.</Text>

          {notice ? (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>{notice}</Text>
            </View>
          ) : null}

          {children}

          {message ? (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>{message}</Text>
            </View>
          ) : null}

          <Text style={styles.hint}>
            Providers must be enabled in your Clerk dashboard. If one is not enabled, try another.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function SignInScreen(props) {
  if (!isClerkConfigured()) {
    return <UnconfiguredSignInScreen />;
  }
  return <ConfiguredSignInScreen {...props} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#1e3a8a',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffcb05',
    borderRadius: 28,
    padding: 24,
    gap: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1f2937',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#4b5563',
    textAlign: 'center',
  },
  buttons: {
    gap: 12,
    marginTop: 4,
  },
  button: {
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  dimmed: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1f2937',
  },
  notice: {
    backgroundColor: '#fff7e0',
    borderRadius: 12,
    padding: 12,
  },
  noticeText: {
    color: '#92400e',
    fontWeight: '700',
    fontSize: 13,
    lineHeight: 18,
  },
  hint: {
    color: '#4b5563',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
});
