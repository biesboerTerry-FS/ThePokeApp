import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useClerk } from '@clerk/expo';
import { useApp } from '../context/AppContext';
import { isClerkConfigured } from '../auth/clerk';

function ClerkSignInButton({ style }) {
  const navigation = useNavigation();
  const { account, signOut } = useApp();
  const { signOut: clerkSignOut } = useClerk();
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    setBusy(true);
    try {
      await clerkSignOut();
    } catch {
      // Ensure local state is cleared even if Clerk sign-out fails.
    } finally {
      signOut();
      setBusy(false);
    }
  }

  if (account) {
    return (
      <View style={styles.wrap}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          accessibilityState={{ busy }}
          onPress={handleSignOut}
          disabled={busy}
          style={[styles.button, styles.signedIn, busy && styles.disabled, style]}
        >
          <Text style={styles.text}>Sign out</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sign in"
        onPress={() => navigation.navigate('SignIn')}
        style={[styles.button, style]}
      >
        <Text style={styles.text}>Sign in</Text>
      </Pressable>
    </View>
  );
}

function PlainSignInButton({ style }) {
  const navigation = useNavigation();
  const { account, signOut } = useApp();

  if (account) {
    return (
      <View style={styles.wrap}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          onPress={signOut}
          style={[styles.button, styles.signedIn, style]}
        >
          <Text style={styles.text}>Sign out</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sign in"
        onPress={() => navigation.navigate('SignIn')}
        style={[styles.button, style]}
      >
        <Text style={styles.text}>Sign in</Text>
      </Pressable>
    </View>
  );
}

// Uses Clerk when configured; otherwise still navigates to the sign-in screen
// so the user sees setup instructions instead of the old Google-only flow.
export default function SignInButton({ style }) {
  if (isClerkConfigured()) {
    return <ClerkSignInButton style={style} />;
  }
  return <PlainSignInButton style={style} />;
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
    gap: 8,
  },
  button: {
    backgroundColor: '#ffffff',
    minHeight: 56,
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signedIn: {
    backgroundColor: '#fee2e2',
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    color: '#1f2937',
    fontWeight: '900',
    fontSize: 16,
  },
});
