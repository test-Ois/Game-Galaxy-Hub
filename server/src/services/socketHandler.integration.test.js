const test = require("node:test");
const assert = require("node:assert/strict");
const { createServer } = require("node:http");
const { Server } = require("socket.io");
const { io: createClient } = require("socket.io-client");
const { registerSocketHandlers } = require("./socketHandler");
const { cleanupRoom } = require("./roomManager");

function waitForEvent(socket, eventName, timeoutMs = 4_000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(eventName, onEvent);
      reject(new Error("Timed out waiting for Socket.IO event: " + eventName));
    }, timeoutMs);
    const onEvent = (payload) => { clearTimeout(timer); resolve(payload); };
    socket.once(eventName, onEvent);
  });
}
async function connectClient(url) {
  const socket = createClient(url, { transports: ["websocket"], reconnection: false, timeout: 4_000 });
  await new Promise((resolve, reject) => {
    socket.once("connect", resolve);
    socket.once("connect_error", reject);
  });
  return socket;
}

test("Socket.IO multiplayer supports Ludo create, join, ready, start, and dice roll", async () => {
  const httpServer = createServer();
  const ioServer = new Server(httpServer, { cors: { origin: "*" } });
  registerSocketHandlers(ioServer);
  await new Promise((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
  const url = "http://127.0.0.1:" + httpServer.address().port;
  let host, guest, roomId;
  try {
    [host, guest] = await Promise.all([connectClient(url), connectClient(url)]);
    const createdPromise = waitForEvent(host, "roomCreated");
    host.emit("createRoom", { name: "Host", gameType: "ludo", maxPlayers: 2, playerId: "ci-ludo-host" });
    const created = await createdPromise;
    roomId = created.roomId;
    assert.match(roomId, /^[A-Z0-9]{6}$/);
    assert.equal(created.gameType, "ludo");
    assert.equal(created.players.length, 1);

    const hostJoinUpdate = waitForEvent(host, "roomUpdated");
    const guestJoin = waitForEvent(guest, "roomJoined");
    guest.emit("joinRoom", { name: "Guest", roomId, playerId: "ci-ludo-guest" });
    const [hostUpdated, guestJoined] = await Promise.all([hostJoinUpdate, guestJoin]);
    assert.equal(hostUpdated.players.length, 2);
    assert.equal(guestJoined.players[1].name, "Guest");
    assert.equal(guestJoined.players[1].symbol, "green");

    let hostReadyUpdate = waitForEvent(host, "roomUpdated");
    let guestReadyUpdate = waitForEvent(guest, "roomUpdated");
    host.emit("ludoToggleReady", { roomId, playerId: "ci-ludo-host", isReady: true });
    await Promise.all([hostReadyUpdate, guestReadyUpdate]);
    hostReadyUpdate = waitForEvent(host, "roomUpdated");
    guestReadyUpdate = waitForEvent(guest, "roomUpdated");
    guest.emit("ludoToggleReady", { roomId, playerId: "ci-ludo-guest", isReady: true });
    await Promise.all([hostReadyUpdate, guestReadyUpdate]);

    const started = waitForEvent(host, "roomUpdated");
    host.emit("ludoStartGame", { roomId, playerId: "ci-ludo-host" });
    const startedRoom = await started;
    assert.equal(startedRoom.status, "playing");
    assert.equal(startedRoom.ludoState.isGameStarted, true);

    const rolled = waitForEvent(host, "roomUpdated");
    host.emit("ludoRollDice", { roomId, playerId: "ci-ludo-host" });
    const rolledRoom = await rolled;
    assert.equal(rolledRoom.ludoState.hasRolled, true);
    assert.ok(rolledRoom.ludoState.diceRoll >= 1 && rolledRoom.ludoState.diceRoll <= 6);
    const duplicateRollError = waitForEvent(host, "errorMsg");
    host.emit("ludoRollDice", { roomId, playerId: "ci-ludo-host" });
    assert.equal(await duplicateRollError, "Already rolled dice.");
  } finally {
    if (host) host.disconnect();
    if (guest) guest.disconnect();
    if (roomId) cleanupRoom(roomId);
    await new Promise((resolve) => ioServer.close(resolve));
  }
});


test("WebRTC voice signaling and mic state relay in both directions", async () => {
  const httpServer = createServer();
  const ioServer = new Server(httpServer, { cors: { origin: "*" } });
  registerSocketHandlers(ioServer);
  await new Promise((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
  const url = "http://127.0.0.1:" + httpServer.address().port;
  let host, guest, roomId;
  try {
    [host, guest] = await Promise.all([connectClient(url), connectClient(url)]);
    const createdPromise = waitForEvent(host, "roomCreated");
    host.emit("createRoom", { name: "Voice Host", gameType: "tictactoe", maxPlayers: 2, boardSize: 3, seriesMode: 1, playerId: "ci-voice-host" });
    const created = await createdPromise;
    roomId = created.roomId;

    const guestJoinPromise = waitForEvent(guest, "roomJoined");
    host.once("roomUpdated", () => {});
    guest.emit("joinRoom", { name: "Voice Guest", roomId, playerId: "ci-voice-guest" });
    await guestJoinPromise;

    const hostOffer = { type: "offer", offer: { type: "offer", sdp: "test-offer-sdp" } };
    const guestOfferPromise = waitForEvent(guest, "voiceSignal");
    host.emit("voiceSignal", { roomId, targetPlayerId: "ci-voice-guest", signal: hostOffer });
    const receivedAtGuest = await guestOfferPromise;
    assert.equal(receivedAtGuest.senderPlayerId, "ci-voice-host");
    assert.deepEqual(receivedAtGuest.signal, hostOffer);

    const guestAnswer = { type: "answer", answer: { type: "answer", sdp: "test-answer-sdp" } };
    const hostAnswerPromise = waitForEvent(host, "voiceSignal");
    guest.emit("voiceSignal", { roomId, targetPlayerId: "ci-voice-host", signal: guestAnswer });
    const receivedAtHost = await hostAnswerPromise;
    assert.equal(receivedAtHost.senderPlayerId, "ci-voice-guest");
    assert.deepEqual(receivedAtHost.signal, guestAnswer);

    const hostStatePromise = waitForEvent(host, "voiceStateUpdate");
    guest.emit("voiceStateUpdate", { roomId, micActive: true, speaking: true });
    assert.deepEqual(await hostStatePromise, { playerId: "ci-voice-guest", micActive: true, speaking: true });

    const guestStatePromise = waitForEvent(guest, "voiceStateUpdate");
    host.emit("voiceStateUpdate", { roomId, micActive: false, speaking: false });
    assert.deepEqual(await guestStatePromise, { playerId: "ci-voice-host", micActive: false, speaking: false });
  } finally {
    if (host) host.disconnect();
    if (guest) guest.disconnect();
    if (roomId) cleanupRoom(roomId);
    await new Promise((resolve) => ioServer.close(resolve));
  }
});
