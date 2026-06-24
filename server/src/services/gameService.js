// ============================================================
// Game Service — Tic-Tac-Toe & Ludo Server Mechanics
// ============================================================

const { rooms, ludoTurnTimers, addChatMessage } = require("./roomManager");

// ─── TIC-TAC-TOE SERVICE HELPERS ───

function winLengthForSize(size) {
  return size === 3 ? 3 : 4;
}

function generateWinPatterns(size, k) {
  const patterns = [];
  const idx = (r, c) => r * size + c;

  // Rows
  for (let r = 0; r < size; r++) {
    for (let c = 0; c <= size - k; c++) {
      const line = [];
      for (let i = 0; i < k; i++) line.push(idx(r, c + i));
      patterns.push(line);
    }
  }

  // Columns
  for (let c = 0; c < size; c++) {
    for (let r = 0; r <= size - k; r++) {
      const line = [];
      for (let i = 0; i < k; i++) line.push(idx(r + i, c));
      patterns.push(line);
    }
  }

  // Diagonal ↘
  for (let r = 0; r <= size - k; r++) {
    for (let c = 0; c <= size - k; c++) {
      const line = [];
      for (let i = 0; i < k; i++) line.push(idx(r + i, c + i));
      patterns.push(line);
    }
  }

  // Diagonal ↗
  for (let r = k - 1; r < size; r++) {
    for (let c = 0; c <= size - k; c++) {
      const line = [];
      for (let i = 0; i < k; i++) line.push(idx(r - i, c + i));
      patterns.push(line);
    }
  }

  return patterns;
}

function checkWinner(board, patterns) {
  for (const pattern of patterns) {
    const values = pattern.map((i) => board[i]);
    if (values.every((v) => v !== null) && values.every((v) => v === values[0])) {
      return { winner: values[0], pattern };
    }
  }
  return null;
}

function isDraw(board) {
  return board.every((cell) => cell !== null);
}

function seriesToWins(bestOf) {
  return bestOf === 1 ? 1 : bestOf === 3 ? 2 : 3;
}

// ─── LUDO SERVICE HELPERS ───

const LUDO_COLORS = ["red", "green", "yellow", "blue"];
const LUDO_START_INDEX = { red: 0, green: 13, yellow: 26, blue: 39 };
const LUDO_SAFE_CELLS = [0, 8, 13, 21, 26, 34, 39, 47];

function initializeLudoState(room, maxPlayers) {
  room.gameType = "ludo";
  room.maxPlayers = maxPlayers;
  room.currentPlayer = "red";
  room.scores = { red: 0, green: 0, yellow: 0, blue: 0 };
  room.seriesWins = { red: 0, green: 0, yellow: 0, blue: 0 };
  room.chatHistory = [];
  room.ludoState = {
    currentPlayerIndex: 0,
    diceRoll: null,
    hasRolled: false,
    tokens: {
      red: [-1, -1, -1, -1],
      green: [-1, -1, -1, -1],
      yellow: [-1, -1, -1, -1],
      blue: [-1, -1, -1, -1],
    },
    rankings: [],
    isGameStarted: false,
    winner: null,
  };
}

function advanceLudoTurn(room) {
  const activeColors = room.players.map((p) => p.symbol);
  const finishedColors = room.ludoState?.rankings || [];
  const colorOrder = ["red", "green", "yellow", "blue"];
  let currColor = room.currentPlayer;
  let nextIndex = colorOrder.indexOf(currColor);

  for (let i = 0; i < 4; i++) {
    nextIndex = (nextIndex + 1) % 4;
    const checkColor = colorOrder[nextIndex];
    if (activeColors.includes(checkColor) && !finishedColors.includes(checkColor)) {
      room.currentPlayer = checkColor;
      room.ludoState.currentPlayerIndex = nextIndex;
      break;
    }
  }
  room.ludoState.diceRoll = null;
  room.ludoState.hasRolled = false;
}

function getValidMoves(color, roll, tokens) {
  const valid = [];
  const playerTokens = tokens[color];
  for (let i = 0; i < 4; i++) {
    const pos = playerTokens[i];
    if (pos === -1) {
      if (roll === 6) valid.push(i);
    } else if (pos < 56) {
      if (pos + roll <= 56) {
        valid.push(i);
      }
    }
  }
  return valid;
}

function startLudoTurnTimer(roomId, io) {
  if (ludoTurnTimers.has(roomId)) {
    clearTimeout(ludoTurnTimers.get(roomId));
    ludoTurnTimers.delete(roomId);
  }

  const room = rooms.get(roomId);
  if (!room || room.status !== "playing" || room.gameType !== "ludo") return;

  const activeColor = room.currentPlayer;
  const player = room.players.find((p) => p.symbol === activeColor);

  const timer = setTimeout(() => {
    console.log(`Turn timer expired for ${activeColor} in room ${roomId}`);
    const freshRoom = rooms.get(roomId);
    if (!freshRoom || freshRoom.status !== "playing" || freshRoom.currentPlayer !== activeColor) return;

    if (!freshRoom.ludoState.hasRolled) {
      // Auto roll dice
      const roll = Math.floor(Math.random() * 6) + 1;
      freshRoom.ludoState.diceRoll = roll;
      freshRoom.ludoState.hasRolled = true;
      addChatMessage(
        freshRoom,
        "system",
        "System",
        `${player ? player.name : activeColor} rolled a ${roll} (Auto Roll)`,
        "system",
        "game_event"
      );

      const validMoves = getValidMoves(activeColor, roll, freshRoom.ludoState.tokens);
      if (validMoves.length === 0) {
        setTimeout(() => {
          const r = rooms.get(roomId);
          if (r && r.status === "playing" && r.currentPlayer === activeColor) {
            advanceLudoTurn(r);
            io.to(roomId).emit("roomUpdated", r);
            startLudoTurnTimer(roomId, io);
          }
        }, 1500);
      } else {
        setTimeout(() => {
          const r = rooms.get(roomId);
          if (r && r.status === "playing" && r.currentPlayer === activeColor) {
            const tokenToMove = validMoves[Math.floor(Math.random() * validMoves.length)];
            executeLudoMove(r, activeColor, tokenToMove);
            io.to(roomId).emit("roomUpdated", r);
            startLudoTurnTimer(roomId, io);
          }
        }, 1500);
      }
      io.to(roomId).emit("roomUpdated", freshRoom);
    } else {
      // Auto move
      const roll = freshRoom.ludoState.diceRoll;
      const validMoves = getValidMoves(activeColor, roll, freshRoom.ludoState.tokens);
      if (validMoves.length > 0) {
        const tokenToMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        executeLudoMove(freshRoom, activeColor, tokenToMove);
      } else {
        advanceLudoTurn(freshRoom);
      }
      io.to(roomId).emit("roomUpdated", freshRoom);
      startLudoTurnTimer(roomId, io);
    }
  }, 15000);

  ludoTurnTimers.set(roomId, timer);
}

function executeLudoMove(room, color, tokenIndex) {
  const roll = room.ludoState.diceRoll;
  const tokens = room.ludoState.tokens[color];
  const oldPos = tokens[tokenIndex];
  let newPos = oldPos;

  if (oldPos === -1 && roll === 6) {
    newPos = 0;
  } else if (oldPos >= 0 && oldPos < 56) {
    newPos = oldPos + roll;
  }

  tokens[tokenIndex] = newPos;

  const player = room.players.find((p) => p.symbol === color);
  const pName = player ? player.name : color;

  addChatMessage(
    room,
    "system",
    "System",
    `${pName} moved token ${tokenIndex + 1} to position ${newPos === 56 ? "Home" : newPos}`,
    "system",
    "game_event"
  );

  let extraTurn = false;

  if (newPos === 56) {
    extraTurn = true;
    addChatMessage(
      room,
      "system",
      "System",
      `🎉 ${pName}'s token ${tokenIndex + 1} reached home!`,
      "system",
      "game_event"
    );

    if (tokens.every((pos) => pos === 56)) {
      if (!room.ludoState.rankings.includes(color)) {
        room.ludoState.rankings.push(color);
        addChatMessage(
          room,
          "system",
          "System",
          `🏆 ${pName} finished all tokens!`,
          "system",
          "game_event"
        );
      }

      const activeColors = room.players.map((p) => p.symbol);
      const finishedColors = room.ludoState.rankings;
      const unfinishedColors = activeColors.filter((c) => !finishedColors.includes(c));

      if (unfinishedColors.length <= 1 || finishedColors.length === activeColors.length) {
        unfinishedColors.forEach((c) => {
          if (!room.ludoState.rankings.includes(c)) {
            room.ludoState.rankings.push(c);
          }
        });

        room.ludoState.winner = room.ludoState.rankings[0];
        room.status = "finished";
        room.isGameOver = true;
        room.isSeriesComplete = true;
        room.seriesWinner = room.ludoState.winner;

        addChatMessage(
          room,
          "system",
          "System",
          `🏁 Game Over! Winner is ${
            room.players.find((p) => p.symbol === room.ludoState.winner)?.name || room.ludoState.winner
          }`,
          "system",
          "game_event"
        );

        if (ludoTurnTimers.has(room.roomId)) {
          clearTimeout(ludoTurnTimers.get(room.roomId));
          ludoTurnTimers.delete(room.roomId);
        }
        return;
      }
    }
  }

  // Token Capture
  if (newPos >= 0 && newPos <= 50) {
    const absCell = (LUDO_START_INDEX[color] + newPos) % 52;
    const isSafe = LUDO_SAFE_CELLS.includes(absCell);

    if (!isSafe) {
      room.players.forEach((p) => {
        const otherColor = p.symbol;
        if (otherColor !== color) {
          const otherTokens = room.ludoState.tokens[otherColor];
          for (let i = 0; i < 4; i++) {
            const oStep = otherTokens[i];
            if (oStep >= 0 && oStep <= 50) {
              const oAbsCell = (LUDO_START_INDEX[otherColor] + oStep) % 52;
              if (oAbsCell === absCell) {
                otherTokens[i] = -1;
                extraTurn = true;
                addChatMessage(
                  room,
                  "system",
                  "System",
                  `⚔️ ${pName} captured ${p.name}'s token ${i + 1}!`,
                  "system",
                  "game_event"
                );
              }
            }
          }
        }
      });
    }
  }

  if (roll === 6) {
    extraTurn = true;
  }

  if (extraTurn) {
    room.ludoState.diceRoll = null;
    room.ludoState.hasRolled = false;
    addChatMessage(room, "system", "System", `🔄 ${pName} gets an extra turn!`, "system", "game_event");
  } else {
    advanceLudoTurn(room);
  }
}

module.exports = {
  winLengthForSize,
  generateWinPatterns,
  checkWinner,
  isDraw,
  seriesToWins,
  LUDO_COLORS,
  initializeLudoState,
  advanceLudoTurn,
  getValidMoves,
  startLudoTurnTimer,
  executeLudoMove,
};
