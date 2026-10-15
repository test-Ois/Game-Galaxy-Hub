const test = require("node:test");
const assert = require("node:assert/strict");

const {
  rooms,
  playerRooms,
  reconnectTimers,
  ludoTurnTimers,
  cleanupRoom,
} = require("./roomManager");

test("cleanupRoom removes room indexes and clears its timers", () => {
  const roomId = "TEST01";
  const playerId = "player-test";
  const reconnectTimer = setTimeout(() => {}, 60_000);
  const turnTimer = setTimeout(() => {}, 60_000);

  rooms.set(roomId, {
    players: [{ playerId, isConnected: false }],
  });
  playerRooms.set(playerId, roomId);
  reconnectTimers.set(playerId, reconnectTimer);
  ludoTurnTimers.set(roomId, turnTimer);

  cleanupRoom(roomId);

  assert.equal(rooms.has(roomId), false);
  assert.equal(playerRooms.has(playerId), false);
  assert.equal(reconnectTimers.has(playerId), false);
  assert.equal(ludoTurnTimers.has(roomId), false);
});
