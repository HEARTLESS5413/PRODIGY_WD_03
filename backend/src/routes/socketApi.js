export function createSocketApi(io, state) {
  return {
    emitToUser(userId, event, payload) {
      const sockets = state.onlineUsers.get(userId);

      if (!sockets) {
        return;
      }

      for (const socketId of sockets) {
        io.to(socketId).emit(event, payload);
      }
    },
    isUserOnline(userId) {
      return state.onlineUsers.has(userId) && state.onlineUsers.get(userId).size > 0;
    },
    listOnlineUserIds() {
      return [...state.onlineUsers.keys()];
    },
  };
}
