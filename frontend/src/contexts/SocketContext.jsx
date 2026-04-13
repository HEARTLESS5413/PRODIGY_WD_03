import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { refreshUser, token, user } = useAuth();
  const refreshUserRef = useRef(refreshUser);
  const socketRef = useRef(null);
  const [activeGame, setActiveGame] = useState(null);
  const [incomingInvites, setIncomingInvites] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [matchmakingState, setMatchmakingState] = useState({
    message: '',
    status: 'idle',
  });
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [pendingInvite, setPendingInvite] = useState(null);

  // ── DM state ──
  const [dmMessages, setDmMessages] = useState({}); // { friendId: [messages] }
  const [dmTyping, setDmTyping] = useState({}); // { friendId: boolean }
  const [dmUnread, setDmUnread] = useState({}); // { friendId: number }
  const [dmNotification, setDmNotification] = useState(null); // { fromUsername, message }

  useEffect(() => {
    refreshUserRef.current = refreshUser;
  }, [refreshUser]);

  useEffect(() => {
    if (!token || !user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setIncomingInvites([]);
      setPendingInvite(null);
      setMatchmakingState({ message: '', status: 'idle' });
      setOnlineUserIds([]);
      setIsConnected(false);
      setDmMessages({});
      setDmTyping({});
      setDmUnread({});
      setDmNotification(null);
      return;
    }

    const socket = io(import.meta.env.VITE_SOCKET_URL || undefined, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('presence:sync', ({ userIds }) => {
      setOnlineUserIds(userIds || []);
    });

    socket.on('presence:update', ({ isOnline, userId }) => {
      setOnlineUserIds((previous) => {
        const next = new Set(previous);

        if (isOnline) {
          next.add(userId);
        } else {
          next.delete(userId);
        }

        return [...next];
      });
    });

    socket.on('friend:request', async () => {
      await refreshUserRef.current?.();
    });

    socket.on('friend:accepted', async () => {
      await refreshUserRef.current?.();
    });

    socket.on('inviteReceived', (invite) => {
      setIncomingInvites((previous) => [...previous.filter((item) => item.inviteId !== invite.inviteId), invite]);
    });

    socket.on('inviteSent', (invite) => {
      setPendingInvite(invite);
    });

    socket.on('inviteRejected', ({ inviteId }) => {
      setPendingInvite((current) => (current?.inviteId === inviteId ? null : current));
    });

    socket.on('inviteExpired', ({ inviteId }) => {
      setPendingInvite((current) => (current?.inviteId === inviteId ? null : current));
      setIncomingInvites((previous) => previous.filter((invite) => invite.inviteId !== inviteId));
    });

    socket.on('matchmaking:update', (payload) => {
      setMatchmakingState(payload);
    });

    socket.on('gameStarted', ({ game }) => {
      setMatchmakingState({ message: '', status: 'idle' });
      setPendingInvite(null);
      setIncomingInvites([]);
      setActiveGame(game);
    });

    socket.on('invite:error', ({ message }) => {
      setPendingInvite((current) => (current ? { ...current, error: message } : current));
    });

    // ── DM listeners ──
    socket.on('dm:receive', (msg) => {
      const friendId = msg.from === user.id ? msg.to : msg.from;
      setDmMessages((prev) => {
        const existing = prev[friendId] || [];
        if (existing.some((m) => m.id === msg.id)) return prev;
        return { ...prev, [friendId]: [...existing, msg] };
      });
      // Track unread + show notification for incoming messages (not own)
      if (msg.from !== user.id) {
        setDmUnread((prev) => ({ ...prev, [friendId]: (prev[friendId] || 0) + 1 }));
        setDmNotification({ fromUsername: msg.fromUsername, message: msg.message });
      }
    });

    socket.on('dm:historyResult', ({ friendId, messages }) => {
      setDmMessages((prev) => {
        const existing = prev[friendId] || [];
        const existingIds = new Set(existing.map((m) => m.id));
        const newMsgs = messages.filter((m) => !existingIds.has(m.id));
        return { ...prev, [friendId]: [...newMsgs, ...existing] };
      });
    });

    socket.on('dm:typing', ({ fromUserId, isTyping }) => {
      setDmTyping((prev) => ({ ...prev, [fromUserId]: isTyping }));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [token, user?.id]);

  const emit = useCallback((eventName, payload) => {
    socketRef.current?.emit(eventName, payload);
  }, []);

  const clearActiveGame = useCallback(() => {
    setActiveGame(null);
  }, []);

  const dismissInvite = useCallback((inviteId) => {
    setIncomingInvites((previous) => previous.filter((invite) => invite.inviteId !== inviteId));
  }, []);

  const joinMatchmaking = useCallback(() => emit('matchmaking', { action: 'join' }), [emit]);
  const joinRoom = useCallback((gameId) => emit('joinRoom', { gameId }), [emit]);
  const leaveMatchmaking = useCallback(() => emit('matchmaking', { action: 'leave' }), [emit]);
  const requestRematch = useCallback((gameId) => emit('requestRematch', { gameId }), [emit]);
  const sendChatMessage = useCallback((gameId, message) => emit('chatMessage', { gameId, message }), [emit]);
  const sendGameMove = useCallback((gameId, index) => emit('gameMove', { gameId, index }), [emit]);
  const sendInvite = useCallback((toUserId) => emit('sendInvite', { toUserId }), [emit]);
  const sendTyping = useCallback((gameId, isTyping) => emit('typing', { gameId, isTyping }), [emit]);
  const acceptInviteAction = useCallback((inviteId) => emit('acceptInvite', { inviteId }), [emit]);
  const rejectInviteAction = useCallback((inviteId) => emit('rejectInvite', { inviteId }), [emit]);
  const leaveGame = useCallback((gameId) => emit('leaveGame', { gameId }), [emit]);

  // ── DM callbacks ──
  const sendDM = useCallback((toUserId, message) => emit('dm:send', { toUserId, message }), [emit]);
  const loadDMHistory = useCallback((friendId, before) => emit('dm:history', { friendId, before }), [emit]);
  const sendDMTyping = useCallback((toUserId, isTyping) => emit('dm:typing', { toUserId, isTyping }), [emit]);
  const clearDMUnread = useCallback((friendId) => {
    setDmUnread((prev) => { const next = { ...prev }; delete next[friendId]; return next; });
  }, []);
  const clearDMNotification = useCallback(() => setDmNotification(null), []);

  return (
    <SocketContext.Provider
      value={{
        acceptInvite: acceptInviteAction,
        activeGame,
        clearActiveGame,
        clearDMNotification,
        clearDMUnread,
        dismissInvite,
        dmMessages,
        dmNotification,
        dmTyping,
        dmUnread,
        incomingInvites,
        isConnected,
        joinMatchmaking,
        joinRoom,
        leaveGame,
        leaveMatchmaking,
        loadDMHistory,
        matchmakingState,
        onlineUserIds,
        pendingInvite,
        rejectInvite: rejectInviteAction,
        requestRematch,
        sendChatMessage,
        sendDM,
        sendDMTyping,
        sendGameMove,
        sendInvite,
        sendTyping,
        socket: socketRef.current,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const value = useContext(SocketContext);

  if (!value) {
    throw new Error('useSocket must be used inside SocketProvider.');
  }

  return value;
}
