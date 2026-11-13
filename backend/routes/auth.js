const express = require('express');
const { createClerkClient, verifyToken } = require('@clerk/backend');
const User = require('../models/User');
const { signSession } = require('../middleware/auth');

const router = express.Router();

// Confirms a Google access token belongs to this app (its audience matches our
// OAuth client) and returns the Google profile it was issued for.
async function verifyGoogleAccessToken(accessToken) {
  const tokenInfo = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`
  );
  if (!tokenInfo.ok) {
    throw new Error('Google rejected the access token.');
  }

  const info = await tokenInfo.json();
  const expectedClient = process.env.GOOGLE_CLIENT_ID;

  if (expectedClient && info.aud !== expectedClient) {
    throw new Error('Google token was issued to a different app.');
  }

  const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!profileResponse.ok) {
    throw new Error('Could not load the Google profile.');
  }

  return profileResponse.json();
}

router.post('/google', async (request, response) => {
  const accessToken = request.body?.accessToken;

  if (!accessToken) {
    return response.status(400).json({ message: 'accessToken is required.' });
  }

  let profile;
  try {
    profile = await verifyGoogleAccessToken(accessToken);
  } catch (error) {
    return response.status(401).json({ message: error.message });
  }

  const user = await User.findOneAndUpdate(
    { googleId: profile.sub },
    {
      $set: {
        email: profile.email || '',
        picture: profile.picture || '',
      },
      $setOnInsert: {
        name: profile.name || profile.email || 'Trainer',
      },
    },
    { upsert: true, new: true }
  );

  response.json({
    token: signSession(user._id),
    user: publicUser(user),
  });
});

async function verifyClerkSessionToken(sessionToken) {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Clerk is not configured on the server.');
  }

  let payload;
  try {
    payload = await verifyToken(sessionToken, { secretKey });
  } catch (error) {
    throw new Error('Invalid Clerk session.');
  }

  const clerkId = payload?.sub;
  if (!clerkId) {
    throw new Error('Invalid Clerk session.');
  }

  const clerk = createClerkClient({ secretKey });
  const clerkUser = await clerk.users.getUser(clerkId);

  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
    clerkUser.username ||
    clerkUser.primaryEmailAddress?.emailAddress ||
    'Trainer';
  const email =
    clerkUser.primaryEmailAddress?.emailAddress ||
    clerkUser.emailAddresses?.[0]?.emailAddress ||
    '';
  const picture = clerkUser.imageUrl || '';

  return { clerkId, name, email, picture };
}

router.post('/clerk', async (request, response) => {
  const sessionToken = request.body?.sessionToken;

  if (!sessionToken) {
    return response.status(400).json({ message: 'sessionToken is required.' });
  }

  let profile;
  try {
    profile = await verifyClerkSessionToken(sessionToken);
  } catch (error) {
    const status = /not configured/i.test(error.message) ? 503 : 401;
    return response.status(status).json({ message: error.message });
  }

  const user = await User.findOneAndUpdate(
    { clerkId: profile.clerkId },
    {
      $set: {
        email: profile.email || '',
        picture: profile.picture || '',
      },
      $setOnInsert: {
        name: profile.name || 'Trainer',
      },
    },
    { upsert: true, new: true }
  );

  response.json({
    token: signSession(user._id),
    user: publicUser(user),
  });
});

function publicUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    picture: user.picture,
    defaultDifficulty: user.defaultDifficulty,
  };
}

module.exports = { router, publicUser };
