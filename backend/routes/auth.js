const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const DEMO_LOGIN = process.env.DEMO_LOGIN === 'true';

function signDemoToken() {
  return jwt.sign(
    { sub: 'demo-user', email: 'demo@thepokeapp.dev', name: 'Demo Trainer', demo: true },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function requireAuth(request, response, next) {
  const authHeader = request.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return response.status(401).json({ message: 'Authentication required.' });
  }

  try {
    request.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    return response.status(401).json({ message: 'Invalid or expired token.' });
  }
}

function demoLogin(request, response) {
  if (!DEMO_LOGIN) {
    return response.status(403).json({ message: 'Demo login is disabled.' });
  }

  const token = signDemoToken();
  response.json({
    token,
    user: {
      id: 'demo-user',
      email: 'demo@thepokeapp.dev',
      name: 'Demo Trainer',
    },
  });
}

module.exports = { demoLogin, requireAuth };
