import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const ROLES = ['client', 'therapist', 'admin'];

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function signToken(user, secret) {
  return jwt.sign({ sub: user.id, role: user.role, name: user.name }, secret, { expiresIn: '12h' });
}

export function publicUser(user) {
  return {
    id: user.id,
    login: user.login,
    role: user.role,
    name: user.name,
    phone: user.phone || '',
    createdAt: user.createdAt,
  };
}

export function requireAuth(secret) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) return res.status(401).json({ error: 'auth_required' });

    try {
      req.user = jwt.verify(token, secret);
      return next();
    } catch {
      return res.status(401).json({ error: 'invalid_token' });
    }
  };
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'forbidden' });
    }
    return next();
  };
}
