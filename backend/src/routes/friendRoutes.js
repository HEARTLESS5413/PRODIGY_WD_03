import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { mapFriendRequest, mapUserSummary } from '../utils/serializers.js';

async function loadUserWithNetwork(userId) {
  return User.findById(userId)
    .populate('friends', 'username')
    .populate('friendRequests.from', 'username');
}

export default function createFriendRoutes(socketApi) {
  const router = Router();

  router.get('/', protect, asyncHandler(async (req, res) => {
    const user = await loadUserWithNetwork(req.auth.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.json({
      friends: user.friends.map((friend) => ({
        ...mapUserSummary(friend),
        isOnline: socketApi.isUserOnline(friend._id.toString()),
      })),
    });
  }));

  router.get('/requests', protect, asyncHandler(async (req, res) => {
    const user = await loadUserWithNetwork(req.auth.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.json({
      requests: user.friendRequests.map((request) => ({
        ...mapFriendRequest(request),
        isOnline: socketApi.isUserOnline(request.from?._id?.toString()),
      })),
    });
  }));

  router.post('/request/:userId', protect, asyncHandler(async (req, res) => {
    const targetUserId = req.params.userId;

    if (targetUserId === req.auth.userId) {
      return res.status(400).json({ message: 'You cannot send a friend request to yourself.' });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(req.auth.userId).select('username friends friendRequests'),
      User.findById(targetUserId).select('username friends friendRequests'),
    ]);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const alreadyFriends = currentUser.friends.some((friendId) => friendId.toString() === targetUserId);
    const alreadyRequested = targetUser.friendRequests.some(
      (request) => request.from.toString() === req.auth.userId
    );
    const hasIncomingRequest = currentUser.friendRequests.some(
      (request) => request.from.toString() === targetUserId
    );

    if (alreadyFriends) {
      return res.status(400).json({ message: 'You are already friends with this user.' });
    }

    if (alreadyRequested) {
      return res.status(400).json({ message: 'Friend request already sent.' });
    }

    if (hasIncomingRequest) {
      return res.status(400).json({ message: 'That user has already sent you a friend request.' });
    }

    targetUser.friendRequests.push({ from: req.auth.userId });
    await targetUser.save();

    socketApi.emitToUser(targetUserId, 'friend:request', {
      from: {
        id: currentUser._id.toString(),
        username: currentUser.username,
      },
    });

    return res.status(201).json({ message: 'Friend request sent.' });
  }));

  router.post('/request/:userId/accept', protect, asyncHandler(async (req, res) => {
    const senderId = req.params.userId;
    const [currentUser, sender] = await Promise.all([
      User.findById(req.auth.userId),
      User.findById(senderId),
    ]);

    if (!currentUser || !sender) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const requestExists = currentUser.friendRequests.some(
      (request) => request.from.toString() === senderId
    );

    if (!requestExists) {
      return res.status(404).json({ message: 'Friend request not found.' });
    }

    currentUser.friendRequests = currentUser.friendRequests.filter(
      (request) => request.from.toString() !== senderId
    );

    if (!currentUser.friends.some((friendId) => friendId.toString() === senderId)) {
      currentUser.friends.push(sender._id);
    }

    if (!sender.friends.some((friendId) => friendId.toString() === req.auth.userId)) {
      sender.friends.push(currentUser._id);
    }

    await Promise.all([currentUser.save(), sender.save()]);

    socketApi.emitToUser(senderId, 'friend:accepted', {
      by: {
        id: currentUser._id.toString(),
        username: currentUser.username,
      },
    });

    return res.json({ message: 'Friend request accepted.' });
  }));

  router.post('/request/:userId/reject', protect, asyncHandler(async (req, res) => {
    const senderId = req.params.userId;
    const currentUser = await User.findById(req.auth.userId);

    if (!currentUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const requestExists = currentUser.friendRequests.some(
      (request) => request.from.toString() === senderId
    );

    if (!requestExists) {
      return res.status(404).json({ message: 'Friend request not found.' });
    }

    currentUser.friendRequests = currentUser.friendRequests.filter(
      (request) => request.from.toString() !== senderId
    );

    await currentUser.save();

    socketApi.emitToUser(senderId, 'friend:rejected', {
      byUserId: req.auth.userId,
    });

    return res.json({ message: 'Friend request rejected.' });
  }));

  return router;
}
