// ============================================================
// Word Battle Socket Handler — Real-Time Word Game Events
// word:create-room, word:join-room, word:start-game,
// word:guess, word:progress, word:win, word:draw,
// word:play-again, word:leave-room
// ============================================================

const { rooms, playerRooms, reconnectTimers, generateRoomId, addChatMessage } = require("./roomManager");

const EASY_WORDS = [
  "GAME","PLAY","STAR","MOON","FIRE","WIND","ROCK","BIRD","LION","FROG",
  "DEER","FISH","PINK","CYAN","GRAY","TEAL","GOLD","TREE","LEAF","SAND",
  "WAVE","COAL","IRON","SHIP","BOAT","TAXI","TRAM","BIKE","CITY","PARK",
  "HOME","CAFE","SHOP","FOOD","CAKE","SOUP","MILK","PEAR","PLUM","WORD",
  "CODE","DATA","CHAT","LINK","GRID","USER","PAGE","HOST","NODE","CHIP",
  "DISK","KING","HERO","BABY","CHEF","CREW"
];

const MEDIUM_WORDS = [
  "ABOUT","ALERT","APPLE","BEACH","BREAD","BRICK","CHAIR","CHEST","CLOCK",
  "CLOUD","CROWN","DANCE","DRAFT","EARTH","FLAME","FLUTE","FRUIT","GRAPE",
  "GREEN","HOUSE","IMAGE","LEMON","LIGHT","MARCH","MONEY","MOUSE","MUSIC",
  "OCEAN","ORGAN","PEACH","PHONE","PIANO","PILOT","PLANT","PLATE","QUEEN",
  "RADIO","RIVER","ROBOT","SCENE","SHARK","SMILE","SNAKE","SPACE","STEAM",
  "STONE","STORM","SUGAR","TABLE","TIGER","TRAIN","TRUCK","VOICE","WATER",
  "WHEEL","WORLD","WRITE","YACHT","ZEBRA"
];

const HARD_WORDS = [
  "ACTION","AIRPORT","ANIMAL","BICYCLE","CAMPUS","CAMERA","CASTLE","COCONUT",
  "DESERT","DIAMOND","DOLPHIN","ENGINE","FESTIVAL","FLAMINGO","FOREST",
  "GALAXY","GUITAR","HARBOR","HEAVEN","HISTORY","JOURNEY","JUNGLE","KITCHEN",
  "LANTERN","LIBRARY","MONSTER","MOUNTAIN","MYSTERY","OCTOPUS","OFFICE",
  "PAINTER","PENGUIN","PROJECT","PYRAMID","RAINBOW","ROCKET","SAILBOAT",
  "SCULPTOR","SHADOW","SOLDIER","SPARROW","STADIUM","SUBWAY","SURGERY",
  "TEACHER","TEMPLE","THEATER","TORNADO","TOURIST","TREASURE","UNIVERSE",
  "VOLCANO","WEATHER","WHISPER","WIZARD","ZEPHYR"
];

function getRandomWord(difficulty) {
  const list = difficulty === "easy" ? EASY_WORDS : difficulty === "medium" ? MEDIUM_WORDS : HARD_WORDS;
  return list[Math.floor(Math.random() * list.length)];
}

function generateWordRoomId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "WB";
  for (let i = 0; i < 4; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
  return id;
}

function registerWordBattleHandlers(io, socket) {
  // ── Create Room ──────────────────────────────────────────────
  socket.on("word:create-room", ({ name, playerId, difficulty = "medium" }) => {
    if (!playerId) return;
    socket.playerId = playerId;

    let roomId = generateWordRoomId();
    while (rooms.has(roomId)) roomId = generateWordRoomId();

    const room = {
      roomId,
      gameType: "wordbattle",
      status: "waiting",
      difficulty,
      secretWord: "",
      maxPlayers: 2,
      players: [
        {
          playerId,
          socketId: socket.id,
          name: name || "Host",
          isHost: true,
          isConnected: true,
          isReady: true,
        },
      ],
      scores: { [playerId]: 0 },
      rematchRequests: [],
      winnerId: null,
      draw: false,
      playerProgress: {},
      chatHistory: [],
      createdAt: new Date(),
    };

    rooms.set(roomId, room);
    playerRooms.set(playerId, roomId);
    socket.join(roomId);

    io.to(roomId).emit("word:room-updated", room);
    console.log(`[WORD BATTLE] Room created: ${roomId} by ${name} (${playerId})`);
  });

  // ── Join Room ────────────────────────────────────────────────
  socket.on("word:join-room", ({ name, roomId, playerId }) => {
    if (!playerId || !roomId) return;
    socket.playerId = playerId;

    const cleanRoomId = roomId.trim().toUpperCase();
    const room = rooms.get(cleanRoomId);

    if (!room || room.gameType !== "wordbattle") {
      socket.emit("word:error", "Room not found.");
      return;
    }

    // Handle reconnect
    const existing = room.players.find((p) => p.playerId === playerId);
    if (existing) {
      existing.socketId = socket.id;
      existing.isConnected = true;
      if (reconnectTimers.has(playerId)) {
        clearTimeout(reconnectTimers.get(playerId));
        reconnectTimers.delete(playerId);
      }
      playerRooms.set(playerId, cleanRoomId);
      socket.join(cleanRoomId);
      io.to(cleanRoomId).emit("word:room-updated", room);
      console.log(`[WORD BATTLE] Player reconnected: ${name} (${playerId}) to ${cleanRoomId}`);
      return;
    }

    if (room.players.length >= room.maxPlayers) {
      socket.emit("word:error", "Room is full.");
      return;
    }
    if (room.status !== "waiting") {
      socket.emit("word:error", "Match already in progress.");
      return;
    }

    room.players.push({
      playerId,
      socketId: socket.id,
      name: name || "Guest",
      isHost: false,
      isConnected: true,
      isReady: true,
    });

    room.scores[playerId] = 0;

    playerRooms.set(playerId, cleanRoomId);
    socket.join(cleanRoomId);

    // Auto-start when 2nd player joins
    if (room.players.length >= 2) {
      const word = getRandomWord(room.difficulty);
      room.secretWord = word;
      room.status = "playing";
      room.playerProgress = {};
      room.players.forEach((p) => {
        room.playerProgress[p.playerId] = {
          guesses: [],
          attemptsUsed: 0,
          solved: false,
          failed: false,
        };
      });

      io.to(cleanRoomId).emit("word:room-updated", room);
      console.log(`[WORD BATTLE] Game started in Room: ${cleanRoomId} | Word: ${word}`);
    } else {
      io.to(cleanRoomId).emit("word:room-updated", room);
    }

    console.log(`[WORD BATTLE] ${name} (${playerId}) joined Room: ${cleanRoomId}`);
  });

  // ── Rejoin Room ──────────────────────────────────────────────
  socket.on("word:rejoin-room", ({ roomId, playerId }) => {
    if (!roomId || !playerId) return;
    const cleanRoomId = roomId.toUpperCase();
    const room = rooms.get(cleanRoomId);
    if (!room || room.gameType !== "wordbattle") return;

    const player = room.players.find((p) => p.playerId === playerId);
    if (player) {
      player.socketId = socket.id;
      player.isConnected = true;
      if (reconnectTimers.has(playerId)) {
        clearTimeout(reconnectTimers.get(playerId));
        reconnectTimers.delete(playerId);
      }
      playerRooms.set(playerId, cleanRoomId);
      socket.join(cleanRoomId);
      io.to(cleanRoomId).emit("word:room-updated", room);
      console.log(`[WORD BATTLE] Rejoined: ${playerId} => ${cleanRoomId}`);
    }
  });

  // ── Guess ────────────────────────────────────────────────────
  socket.on("word:guess", ({ roomId, playerId, guess }) => {
    const room = rooms.get(roomId);
    if (!room || room.status !== "playing" || room.gameType !== "wordbattle") return;

    const playerProgress = room.playerProgress[playerId];
    if (!playerProgress || playerProgress.solved || playerProgress.failed) return;

    const upperGuess = guess.toUpperCase();
    playerProgress.guesses.push(upperGuess);
    playerProgress.attemptsUsed += 1;

    const isCorrect = upperGuess === room.secretWord;
    const isExhausted = playerProgress.attemptsUsed >= 6;

    if (isCorrect) {
      playerProgress.solved = true;
      io.to(roomId).emit("word:room-updated", room);

      // Check if all other players are done
      const allDone = room.players.every((p) => {
        const prog = room.playerProgress[p.playerId];
        return prog && (prog.solved || prog.failed);
      });

      // If first to solve, that player wins
      if (!room.winnerId) {
        room.winnerId = playerId;
        // Mark everyone else as failed
        room.players.forEach((p) => {
          if (p.playerId !== playerId) {
            room.playerProgress[p.playerId].failed = true;
          }
        });
        room.status = "finished";
        io.to(roomId).emit("word:room-updated", room);
        console.log(`[WORD BATTLE] Winner: ${playerId} in Room ${roomId}`);
      }
    } else if (isExhausted) {
      playerProgress.failed = true;

      // Check if all players failed
      const allFailed = room.players.every((p) => {
        const prog = room.playerProgress[p.playerId];
        return prog && (prog.solved || prog.failed);
      });

      if (allFailed && !room.winnerId) {
        room.draw = true;
        room.status = "finished";
        io.to(roomId).emit("word:room-updated", room);
        console.log(`[WORD BATTLE] Draw in Room ${roomId} | Word: ${room.secretWord}`);
      } else {
        io.to(roomId).emit("word:room-updated", room);
      }
    } else {
      io.to(roomId).emit("word:room-updated", room);
    }
  });

  // ── Progress Sync ────────────────────────────────────────────
  socket.on("word:progress", ({ roomId, playerId, attemptsUsed }) => {
    const room = rooms.get(roomId);
    if (!room || room.gameType !== "wordbattle") return;
    if (room.playerProgress && room.playerProgress[playerId]) {
      room.playerProgress[playerId].attemptsUsed = attemptsUsed;
    }
    // Broadcast progress to opponents only (not the sender)
    socket.to(roomId).emit("word:room-updated", room);
  });

  // ── Play Again ───────────────────────────────────────────────
  socket.on("word:play-again", ({ roomId, playerId }) => {
    const room = rooms.get(roomId);
    if (!room || room.gameType !== "wordbattle") return;

    if (!room.rematchRequests.includes(playerId)) {
      room.rematchRequests.push(playerId);
    }

    io.to(roomId).emit("word:room-updated", room);

    if (room.rematchRequests.length >= room.players.length && room.players.length >= 2) {
      // Reset for new round
      const word = getRandomWord(room.difficulty);
      room.secretWord = word;
      room.status = "playing";
      room.winnerId = null;
      room.draw = false;
      room.rematchRequests = [];
      room.playerProgress = {};
      room.players.forEach((p) => {
        room.playerProgress[p.playerId] = {
          guesses: [],
          attemptsUsed: 0,
          solved: false,
          failed: false,
        };
      });

      io.to(roomId).emit("word:room-updated", room);
      console.log(`[WORD BATTLE] Rematch started in Room: ${roomId} | Word: ${word}`);
    }
  });

  // ── Leave Room ───────────────────────────────────────────────
  socket.on("word:leave-room", ({ roomId, playerId }) => {
    if (!roomId || !playerId) return;
    const cleanRoomId = roomId.toUpperCase();
    const room = rooms.get(cleanRoomId);
    if (!room || room.gameType !== "wordbattle") return;

    const leavingPlayer = room.players.find((p) => p.playerId === playerId);
    room.players = room.players.filter((p) => p.playerId !== playerId);
    playerRooms.delete(playerId);
    socket.leave(cleanRoomId);

    if (room.players.length === 0) {
      rooms.delete(cleanRoomId);
      console.log(`[WORD BATTLE] Room ${cleanRoomId} deleted (empty).`);
    } else {
      // Remaining player wins if game was in progress
      if (room.status === "playing" && !room.winnerId) {
        const remaining = room.players[0];
        room.winnerId = remaining.playerId;
        room.status = "finished";
      }
      socket.to(cleanRoomId).emit("word:room-updated", room);
      socket.to(cleanRoomId).emit("word:opponent-left", { playerId });
      console.log(`[WORD BATTLE] ${leavingPlayer?.name || playerId} left Room ${cleanRoomId}.`);
    }
  });
}

module.exports = { registerWordBattleHandlers };
