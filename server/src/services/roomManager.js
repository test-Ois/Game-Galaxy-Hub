// ============================================================
// Room Manager — In-Memory Store & Helper Actions
// ============================================================

const rooms = new Map();
const playerRooms = new Map();
const reconnectTimers = new Map();
const ludoTurnTimers = new Map();

function generateRoomId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "";
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

function addChatMessage(room, senderId, senderName, content, type = "chat", systemType) {
  if (!room.chatHistory) room.chatHistory = [];
  const msg = {
    id: Math.random().toString(36).substring(2, 9),
    senderId,
    senderName,
    content,
    timestamp: Date.now(),
    type,
    systemType,
  };
  room.chatHistory.push(msg);
  if (room.chatHistory.length > 200) {
    room.chatHistory.shift();
  }
  return msg;
}

/**
 * Remove a room and every timer/player index owned by it.
 * Centralizing cleanup prevents stale playerRooms entries after room expiry.
 */
function cleanupRoom(roomId) {
  const room = rooms.get(roomId);
  if (room) {
    for (const player of room.players || []) {
      if (playerRooms.get(player.playerId) === roomId) {
        playerRooms.delete(player.playerId);
      }
      const reconnectTimer = reconnectTimers.get(player.playerId);
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimers.delete(player.playerId);
      }
    }
  }

  const turnTimer = ludoTurnTimers.get(roomId);
  if (turnTimer) {
    clearTimeout(turnTimer);
    ludoTurnTimers.delete(roomId);
  }
  rooms.delete(roomId);
}

function startSweeper() {
  const interval = setInterval(() => {
    const now = Date.now();
    const maxAge = 2 * 60 * 60 * 1000; // 2 hours limit

    for (const [roomId, room] of rooms.entries()) {
      const createdAt = room.createdAt ? new Date(room.createdAt).getTime() : now;
      const players = Array.isArray(room.players) ? room.players : [];
      const hasConnectedPlayers = players.some((player) => player.isConnected);
      if (now - createdAt > maxAge || !hasConnectedPlayers || players.length === 0) {
        console.log(`[Sweeper] Cleaning up inactive/orphaned room ${roomId}`);
        cleanupRoom(roomId);
      }
    }
  }, 10 * 60 * 1000);

  // Do not keep Node's test runner or one-off scripts alive solely for cleanup.
  if (typeof interval.unref === "function") interval.unref();
}

startSweeper();

module.exports = {
  rooms,
  playerRooms,
  reconnectTimers,
  ludoTurnTimers,
  generateRoomId,
  addChatMessage,
  cleanupRoom,
};
