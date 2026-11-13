import { useEffect, useRef } from 'react';
import { useAuth, useUser } from '@clerk/expo';
import { useApp } from '../context/AppContext';
import { signInWithClerkToBackend } from '../api/client';

// Exchanges an active Clerk session for the app's backend session token so
// protected game/profile requests can be made. Runs only when Clerk is configured.
export default function ClerkSync() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const { account, signIn, signOut } = useApp();
  const syncedFor = useRef(null);
  const syncing = useRef(false);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn || !user) {
      syncedFor.current = null;
      if (account?.provider === 'clerk') {
        signOut();
      }
      return;
    }

    const clerkId = user.id;
    if (syncedFor.current === clerkId || syncing.current) {
      return;
    }

    let cancelled = false;
    syncing.current = true;

    (async () => {
      try {
        const sessionToken = await getToken();
        if (!sessionToken || cancelled) {
          return;
        }

        let backend = null;
        try {
          backend = await signInWithClerkToBackend(sessionToken);
        } catch {
          // Backend exchange failed; keep the local Clerk identity so the user
          // is still signed in, but results cannot sync without a backend token.
        }

        if (cancelled) {
          return;
        }

        const name =
          user.fullName ||
          [user.firstName, user.lastName].filter(Boolean).join(' ') ||
          user.username ||
          user.primaryEmailAddress?.emailAddress ||
          'Trainer';
        const email =
          user.primaryEmailAddress?.emailAddress ||
          user.emailAddresses?.[0]?.emailAddress ||
          '';
        const picture = user.imageUrl || '';

        signIn({
          provider: 'clerk',
          clerkId,
          name,
          email,
          picture,
          sessionToken: backend?.token ?? null,
          backendUserId: backend?.user?.id ?? null,
        });
        syncedFor.current = clerkId;
      } finally {
        syncing.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [account?.provider, getToken, isLoaded, isSignedIn, signIn, signOut, user]);

  return null;
}
