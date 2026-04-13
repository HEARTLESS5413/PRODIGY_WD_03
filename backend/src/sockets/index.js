import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { env } from '../config/env.js';
import Game from '../models/Game.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { createSocketApi } from '../routes/socketApi.js';
import { createEmptyBoard, detectWinner, isDraw, serializeGame } from '../utils/gameLogic.js';

function createRoomCode() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 8);
}

function parseOrigins(clientUrl) {
  if (!clientUrl) return '*';
  const origins = clientUrl.split(',').map((o) => o.trim()).filter(Boolean);
  return origins.length === 1 ? origins[0] : origins;
}

export function initializeSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: parseOrigins(env.clientUrl),
      methods: ['GET', 'POST'],
    },
  });

  const state = {
    onlineUsers: new Map(),
    pendingInvites: new Map(),
    randomQueue: [],
  };

  const socketApi = createSocketApi(io, state);

  function addOnlineSocket(userId, socketId) {
    if (!state.onlineUsers.has(userId)) {
      state.onlineUsers.set(userId, new Set());
    }

    state.onlineUsers.get(userId).add(socketId);
  }

  function removeOnlineSocket(userId, socketId) {
    const sockets = state.onlineUsers.get(userId);

    if (!sockets) {
      return false;
    }

    sockets.delete(socketId);

    if (sockets.size === 0) {
      state.onlineUsers.delete(userId);
      return true;
    }

    return false;
  }

  function removeFromQueue(userId) {
    state.randomQueue = state.randomQueue.filter((entry) => entry.userId !== userId);
  }

  function clearUserInvites(userId) {
    for (const [inviteId, invite] of state.pendingInvites.entries()) {
      if (invite.fromUserId === userId || invite.toUserId === userId) {
        state.pendingInvites.delete(inviteId);

        if (invite.fromUserId !== userId) {
          socketApi.emitToUser(invite.fromUserId, 'inviteExpired', { inviteId });
        }

        if (invite.toUserId !== userId) {
          socketApi.emitToUser(invite.toUserId, 'inviteExpired', { inviteId });
        }
      }
    }
  }

  async function createGameRecord({ mode, players }) {
    return Game.create({
      board: createEmptyBoard(),
      currentTurn: 'X',
      mode,
      players,
      roomCode: createRoomCode(),
      status: 'active',
    });
  }

  async function loadGameForUser(gameId, userId) {
    const game = await Game.findById(gameId);

    if (!game) {
      return { error: 'Game not found.' };
    }

    const isParticipant = game.players.some((player) => player.user.toString() === userId);

    if (!isParticipant) {
      return { error: 'You are not part of this game.' };
    }

    return { game };
  }

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error('Authentication required.'));
      }

      const payload = jwt.verify(token, env.jwtSecret);
      const user = await User.findById(payload.userId).select('username');

      if (!user) {
        return next(new Error('User not found.'));
      }

      socket.data.user = {
        id: user._id.toString(),
        username: user.username,
      };

      return next();
    } catch (error) {
      return next(new Error('Unauthorized socket connection.'));
    }
  });

  io.on('connection', (socket) => {
    const currentUser = socket.data.user;
    addOnlineSocket(currentUser.id, socket.id);
    socket.join(`user:${currentUser.id}`);
    socket.emit('presence:sync', { userIds: socketApi.listOnlineUserIds() });
    io.emit('presence:update', { isOnline: true, userId: currentUser.id });

    socket.on('joinRoom', async ({ gameId }) => {
      const { error, game } = await loadGameForUser(gameId, currentUser.id);

      if (error) {
        socket.emit('game:error', { message: error });
        return;
      }

      socket.join(`game:${gameId}`);
      socket.emit('game:update', { game: serializeGame(game) });
    });

    socket.on('sendInvite', async ({ toUserId }) => {
      if (!toUserId) {
        socket.emit('invite:error', { message: 'Choose a friend first.' });
        return;
      }

      const user = await User.findById(currentUser.id).select('friends');
      const isFriend = user?.friends.some((friendId) => friendId.toString() === toUserId);

      if (!isFriend) {
        socket.emit('invite:error', { message: 'You can only invite people from your friends list.' });
        return;
      }

      if (!socketApi.isUserOnline(toUserId)) {
        socket.emit('invite:error', { message: 'That friend is currently offline.' });
        return;
      }

      const inviteId = crypto.randomUUID();
      const invite = {
        inviteId,
        createdAt: new Date().toISOString(),
        fromUserId: currentUser.id,
        fromUsername: currentUser.username,
        toUserId,
      };

      state.pendingInvites.set(inviteId, invite);
      socket.emit('inviteSent', invite);
      socketApi.emitToUser(toUserId, 'inviteReceived', invite);
    });

    socket.on('acceptInvite', async ({ inviteId }) => {
      const invite = state.pendingInvites.get(inviteId);

      if (!invite || invite.toUserId !== currentUser.id) {
        socket.emit('invite:error', { message: 'Invite not found or already expired.' });
        return;
      }

      const opponent = await User.findById(invite.fromUserId).select('username');

      if (!opponent) {
        state.pendingInvites.delete(inviteId);
        socket.emit('invite:error', { message: 'The inviter no longer exists.' });
        return;
      }

      state.pendingInvites.delete(inviteId);
      removeFromQueue(invite.fromUserId);
      removeFromQueue(currentUser.id);

      const game = await createGameRecord({
        mode: 'friend',
        players: [
          { symbol: 'X', user: opponent._id, username: opponent.username },
          { symbol: 'O', user: currentUser.id, username: currentUser.username },
        ],
      });

      const payload = {
        game: serializeGame(game),
        inviteId,
      };

      socketApi.emitToUser(invite.fromUserId, 'gameStarted', payload);
      socketApi.emitToUser(currentUser.id, 'gameStarted', payload);
    });

    socket.on('rejectInvite', ({ inviteId }) => {
      const invite = state.pendingInvites.get(inviteId);

      if (!invite || invite.toUserId !== currentUser.id) {
        socket.emit('invite:error', { message: 'Invite not found or already expired.' });
        return;
      }

      state.pendingInvites.delete(inviteId);
      socketApi.emitToUser(invite.fromUserId, 'inviteRejected', {
        inviteId,
        byUserId: currentUser.id,
      });
    });

    socket.on('matchmaking', async ({ action = 'join' } = {}) => {
      if (action === 'leave') {
        removeFromQueue(currentUser.id);
        socket.emit('matchmaking:update', {
          message: 'You left the random queue.',
          status: 'idle',
        });
        return;
      }

      removeFromQueue(currentUser.id);
      const opponentEntry = state.randomQueue.shift();

      if (!opponentEntry) {
        state.randomQueue.push({
          userId: currentUser.id,
          username: currentUser.username,
        });

        socket.emit('matchmaking:update', {
          message: 'Waiting for another player...',
          status: 'waiting',
        });
        return;
      }

      const game = await createGameRecord({
        mode: 'random',
        players: [
          { symbol: 'X', user: opponentEntry.userId, username: opponentEntry.username },
          { symbol: 'O', user: currentUser.id, username: currentUser.username },
        ],
      });

      const payload = {
        game: serializeGame(game),
      };

      socketApi.emitToUser(opponentEntry.userId, 'gameStarted', payload);
      socketApi.emitToUser(currentUser.id, 'gameStarted', payload);
    });

    socket.on('gameMove', async ({ gameId, index }) => {
      const { error, game } = await loadGameForUser(gameId, currentUser.id);

      if (error) {
        socket.emit('game:error', { message: error });
        return;
      }

      if (game.status !== 'active') {
        socket.emit('game:error', { message: 'This game is not active.' });
        return;
      }

      if (typeof index !== 'number' || index < 0 || index > 8) {
        socket.emit('game:error', { message: 'Invalid move.' });
        return;
      }

      const currentPlayer = game.players.find((player) => player.user.toString() === currentUser.id);

      if (!currentPlayer || currentPlayer.symbol !== game.currentTurn) {
        socket.emit('game:error', { message: 'It is not your turn.' });
        return;
      }

      if (game.board[index]) {
        socket.emit('game:error', { message: 'That square is already taken.' });
        return;
      }

      game.board[index] = currentPlayer.symbol;
      game.markModified('board');
      game.lastMoveAt = new Date();
      game.rematchVotes = [];

      const winner = detectWinner(game.board);

      if (winner) {
        game.status = 'completed';
        game.winner = currentPlayer.user;
        game.winningLine = winner.line;
      } else if (isDraw(game.board)) {
        game.status = 'completed';
        game.winner = null;
        game.winningLine = [];
      } else {
        game.currentTurn = currentPlayer.symbol === 'X' ? 'O' : 'X';
      }

      await game.save();
      io.to(`game:${gameId}`).emit('game:update', {
        game: serializeGame(game),
        move: {
          byUserId: currentUser.id,
          index,
          symbol: currentPlayer.symbol,
        },
      });
    });

    socket.on('chatMessage', async ({ gameId, message }) => {
      const { error } = await loadGameForUser(gameId, currentUser.id);

      if (error) {
        socket.emit('game:error', { message: error });
        return;
      }

      const text = String(message || '').trim().slice(0, 320);

      if (!text) {
        return;
      }

      io.to(`game:${gameId}`).emit('chatMessage', {
        createdAt: new Date().toISOString(),
        gameId,
        id: crypto.randomUUID(),
        message: text,
        userId: currentUser.id,
        username: currentUser.username,
      });
    });

    socket.on('typing', async ({ gameId, isTyping }) => {
      const { error } = await loadGameForUser(gameId, currentUser.id);

      if (error) {
        return;
      }

      socket.to(`game:${gameId}`).emit('typing', {
        gameId,
        isTyping: Boolean(isTyping),
        userId: currentUser.id,
        username: currentUser.username,
      });
    });

    socket.on('requestRematch', async ({ gameId }) => {
      const { error, game } = await loadGameForUser(gameId, currentUser.id);

      if (error) {
        socket.emit('game:error', { message: error });
        return;
      }

      if (game.status !== 'completed') {
        socket.emit('game:error', { message: 'Rematch is only available after a finished game.' });
        return;
      }

      const existingVotes = new Set(game.rematchVotes.map((vote) => vote.toString()));
      existingVotes.add(currentUser.id);
      game.rematchVotes = [...existingVotes];

      if (game.rematchVotes.length < 2) {
        await game.save();
        io.to(`game:${gameId}`).emit('game:update', {
          game: serializeGame(game),
        });
        return;
      }

      game.board = createEmptyBoard();
      game.currentTurn = 'X';
      game.status = 'active';
      game.winner = null;
      game.winningLine = [];
      game.rematchVotes = [];
      game.lastMoveAt = new Date();
      await game.save();

      io.to(`game:${gameId}`).emit('game:update', {
        game: serializeGame(game),
        rematch: true,
      });
    });

    // ── Direct Messages ──
    socket.on('dm:send', async ({ toUserId, message }) => {
      const text = String(message || '').trim().slice(0, 500);
      if (!text || !toUserId) return;

      const user = await User.findById(currentUser.id).select('friends');
      const isFriend = user?.friends.some((fId) => fId.toString() === toUserId);
      if (!isFriend) {
        socket.emit('dm:error', { message: 'You can only message friends.' });
        return;
      }

      const saved = await Message.create({
        from: currentUser.id,
        to: toUserId,
        message: text,
      });

      const payload = {
        id: saved._id.toString(),
        from: currentUser.id,
        fromUsername: currentUser.username,
        to: toUserId,
        message: text,
        createdAt: saved.createdAt.toISOString(),
      };

      socket.emit('dm:receive', payload);
      socketApi.emitToUser(toUserId, 'dm:receive', payload);
    });

    socket.on('dm:history', async ({ friendId, before }) => {
      if (!friendId) return;

      const query = {
        $or: [
          { from: currentUser.id, to: friendId },
          { from: friendId, to: currentUser.id },
        ],
      };
      if (before) query.createdAt = { $lt: new Date(before) };

      const messages = await Message.find(query)
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      socket.emit('dm:historyResult', {
        friendId,
        messages: messages.reverse().map((m) => ({
          id: m._id.toString(),
          from: m.from.toString(),
          to: m.to.toString(),
          message: m.message,
          createdAt: m.createdAt.toISOString(),
        })),
      });
    });

    socket.on('dm:typing', ({ toUserId, isTyping }) => {
      if (!toUserId) return;
      socketApi.emitToUser(toUserId, 'dm:typing', {
        fromUserId: currentUser.id,
        fromUsername: currentUser.username,
        isTyping: Boolean(isTyping),
      });
    });

    // ── Leave Game ──
    socket.on('leaveGame', async ({ gameId }) => {
      const { error, game } = await loadGameForUser(gameId, currentUser.id);
      if (error) {
        socket.emit('game:error', { message: error });
        return;
      }

      if (game.status !== 'active' && game.status !== 'completed') {
        socket.emit('game:error', { message: 'Cannot leave this game.' });
        return;
      }

      const opponent = game.players.find((p) => p.user.toString() !== currentUser.id);

      if (game.status === 'active') {
        game.status = 'abandoned';
        game.winner = opponent ? opponent.user : null;
        game.winningLine = [];
        await game.save();
      }

      io.to(`game:${gameId}`).emit('game:playerLeft', {
        userId: currentUser.id,
        username: currentUser.username,
        game: serializeGame(game),
      });

      socket.leave(`game:${gameId}`);
    });

    socket.on('disconnect', () => {
      removeFromQueue(currentUser.id);
      const isNowOffline = removeOnlineSocket(currentUser.id, socket.id);

      if (isNowOffline) {
        clearUserInvites(currentUser.id);
        io.emit('presence:update', { isOnline: false, userId: currentUser.id });
      }
    });
  });

  return socketApi;
}
