const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';

if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET is not set; using an insecure development secret.');
}

function signSession(userId) {
  return jwt.sign({ sub: String(userId) }, JWT_SECRET, { expiresIn: '30d' });
}

function requireAuth(request, response, next) {
  const header = request.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    request.userId = payload.sub;
    next();
  } catch (error) {
    response.status(401).json({ message: 'Sign in required.' });
  }
}

module.exports = { signSession, requireAuth };
