const test = require("node:test");
const assert = require("node:assert/strict");
const { initializeLudoState, getValidMoves, executeLudoMove } = require("./gameService");

test("Ludo tokens can leave home only when the dice roll is six", () => {
  const room = { roomId: "LUDO01", status: "playing", players: [{ playerId: "red-player", name: "Red", symbol: "red" }], chatHistory: [] };
  initializeLudoState(room, 2);
  assert.deepEqual(getValidMoves("red", 5, room.ludoState.tokens), []);
  assert.deepEqual(getValidMoves("red", 6, room.ludoState.tokens), [0, 1, 2, 3]);
  room.ludoState.diceRoll = 6;
  room.ludoState.hasRolled = true;
  executeLudoMove(room, "red", 0);
  assert.equal(room.ludoState.tokens.red[0], 0);
  assert.equal(room.ludoState.hasRolled, false);
  assert.equal(room.ludoState.diceRoll, null);
});
