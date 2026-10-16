const test = require("node:test");
const assert = require("node:assert/strict");
const { toPublicRoom } = require("./wordBattleHandler");

test("active Word Battle room never exposes the secret word", () => {
  const room = {
    roomId: "WB1234",
    status: "playing",
    secretWord: "GALAXY",
    players: [],
  };

  const publicRoom = toPublicRoom(room);

  assert.equal(publicRoom.wordLength, 6);
  assert.equal(Object.hasOwn(publicRoom, "secretWord"), false);
  assert.equal(room.secretWord, "GALAXY");
});

test("finished Word Battle room may reveal the answer", () => {
  const room = {
    roomId: "WB1234",
    status: "finished",
    secretWord: "GALAXY",
    players: [],
  };

  const publicRoom = toPublicRoom(room);

  assert.equal(publicRoom.wordLength, 6);
  assert.equal(publicRoom.secretWord, "GALAXY");
});

test("waiting room with no word exposes no answer and a zero length", () => {
  const room = {
    roomId: "WB1234",
    status: "waiting",
    secretWord: "",
    players: [],
  };

  const publicRoom = toPublicRoom(room);

  assert.equal(publicRoom.wordLength, 0);
  assert.equal(Object.hasOwn(publicRoom, "secretWord"), false);
});
