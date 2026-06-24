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

function startSweeper() {
  setInterval(() => {
    const now = new Date();
    const maxAge = 2 * 60 * 60 * 1000; // 2 hours limit
    for (const [roomId, room] of rooms.entries()) {
      const roomCreatedAt = room.createdAt ? new Date(room.createdAt) : now;
      const roomAge = now - roomCreatedAt;
      const hasConnectedPlayers = room.players.some((p) => p.isConnected);
      if (roomAge > maxAge || !hasConnectedPlayers || room.players.length === 0) {
        console.log(`[Sweeper] Cleaning up inactive/orphaned room ${roomId}`);
        rooms.delete(roomId);
        if (ludoTurnTimers.has(roomId)) {
          clearTimeout(ludoTurnTimers.get(roomId));
          ludoTurnTimers.delete(roomId);
        }
      }
    }
  }, 10 * 60 * 1000);
}

// Start the room sweeper on initialization
startSweeper();

module.exports = {
  rooms,
  playerRooms,
  reconnectTimers,
  ludoTurnTimers,
  generateRoomId,
  addChatMessage,
};
