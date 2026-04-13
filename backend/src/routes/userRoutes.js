import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default function createUserRoutes(socketApi) {
  const router = Router();

  router.get('/search', protect, asyncHandler(async (req, res) => {
    const query = String(req.query.q || '').trim().toLowerCase();

    if (!query) {
      return res.json({ users: [] });
    }

    const currentUser = await User.findById(req.auth.userId).select('friends friendRequests');

    if (!currentUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const users = await User.find({
      _id: { $ne: req.auth.userId },
      username: { $regex: escapeRegex(query), $options: 'i' },
    })
      .select('username friendRequests')
      .limit(12);

    const friendIds = new Set((currentUser.friends || []).map((friendId) => friendId.toString()));
    const incomingRequestIds = new Set(
      (currentUser.friendRequests || []).map((request) => request.from.toString())
    );

    const results = users.map((user) => {
      const userId = user._id.toString();
      const outgoingRequestIds = new Set((user.friendRequests || []).map((request) => request.from.toString()));
      let requestStatus = 'none';

      if (friendIds.has(userId)) {
        requestStatus = 'friends';
      } else if (incomingRequestIds.has(userId)) {
        requestStatus = 'incoming';
      } else if (outgoingRequestIds.has(req.auth.userId)) {
        requestStatus = 'outgoing';
      }

      return {
        id: userId,
        username: user.username,
        requestStatus,
        isOnline: socketApi.isUserOnline(userId),
      };
    });

    return res.json({ users: results });
  }));

  return router;
}
