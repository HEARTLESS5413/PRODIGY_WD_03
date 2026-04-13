import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signToken } from '../utils/jwt.js';
import { mapProfile } from '../utils/serializers.js';

const router = Router();

async function fetchProfile(userId) {
  return User.findById(userId)
    .populate('friends', 'username')
    .populate('friendRequests.from', 'username');
}

router.post('/register', asyncHandler(async (req, res) => {
  const username = String(req.body.username || '').trim().toLowerCase();
  const password = String(req.body.password || '').trim();

  if (username.length < 3) {
    return res.status(400).json({ message: 'Username must be at least 3 characters.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }

  const existingUser = await User.findOne({ username });

  if (existingUser) {
    return res.status(409).json({ message: 'That username is already taken.' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    username,
    password: hashedPassword,
  });

  const profile = await fetchProfile(user._id);

  return res.status(201).json({
    token: signToken(user._id.toString()),
    user: mapProfile(profile),
  });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const username = String(req.body.username || '').trim().toLowerCase();
  const password = String(req.body.password || '').trim();

  const user = await User.findOne({ username }).select('+password');

  if (!user) {
    return res.status(401).json({ message: 'Invalid username or password.' });
  }

  const passwordsMatch = await bcrypt.compare(password, user.password);

  if (!passwordsMatch) {
    return res.status(401).json({ message: 'Invalid username or password.' });
  }

  const profile = await fetchProfile(user._id);

  return res.json({
    token: signToken(user._id.toString()),
    user: mapProfile(profile),
  });
}));

router.get('/me', protect, asyncHandler(async (req, res) => {
  const user = await fetchProfile(req.auth.userId);

  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  return res.json({ user: mapProfile(user) });
}));

export default router;
