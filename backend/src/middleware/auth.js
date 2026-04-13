import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function protect(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const token = header.split(' ')[1];
    const payload = jwt.verify(token, env.jwtSecret);
    req.auth = { userId: payload.userId };
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

