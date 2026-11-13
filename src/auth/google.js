import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export const isGoogleConfigured = () =>
  Boolean(process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID);

// Authorization Code flow with PKCE, so no client secret is needed in the app.
// Returns the signed-in account, or null if the user cancelled.
export async function signInWithGoogle() {
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new Error(
      'Google sign-in is not configured. Set EXPO_PUBLIC_GOOGLE_CLIENT_ID in .env.'
    );
  }

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'thepokeapp',
    path: 'oauth',
  });

  const request = new AuthSession.AuthRequest({
    clientId,
    redirectUri,
    scopes: ['openid', 'profile', 'email'],
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
  });

  const result = await request.promptAsync(discovery);

  if (result.type !== 'success') {
    return null;
  }

  const tokens = await AuthSession.exchangeCodeAsync(
    {
      clientId,
      code: result.params.code,
      redirectUri,
      extraParams: { code_verifier: request.codeVerifier },
    },
    discovery
  );

  const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${tokens.accessToken}` },
  });

  if (!response.ok) {
    throw new Error('Could not load your Google profile.');
  }

  const profile = await response.json();

  return {
    provider: 'google',
    id: profile.sub,
    name: profile.name || profile.email || 'Trainer',
    email: profile.email || '',
    picture: profile.picture || '',
    accessToken: tokens.accessToken,
  };
}
