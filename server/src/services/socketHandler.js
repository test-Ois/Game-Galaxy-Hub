// ============================================================
// Socket Handler — Real-Time Connections & Signaling
// ============================================================

const {
  rooms,
  playerRooms,
  reconnectTimers,
  ludoTurnTimers,
  generateRoomId,
  addChatMessage,
} = require("./roomManager");

const {
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
} = require("./gameService");

const { registerWordBattleHandlers } = require("./wordBattleHandler");

function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log(`[SOCKET CONNECTED] Socket ID: ${socket.id}`);

    // Register Word Battle-specific handlers
    registerWordBattleHandlers(io, socket);
    socket.on("registerPlayer", ({ playerId }) => {
      console.log(`[PLAYER REGISTERED] Player ID: ${playerId} | Socket ID: ${socket.id}`);
      socket.playerId = playerId;
      
      // If player was in a room and has reconnect timers, clear it
      if (reconnectTimers.has(playerId)) {
        console.log(`[PLAYER RECONNECT] Clearing reconnect timer for player ${playerId}`);
        clearTimeout(reconnectTimers.get(playerId));
        reconnectTimers.delete(playerId);
      }
    });

    // Create Room
    socket.on("createRoom", ({ name, gameType, maxPlayers, boardSize, seriesMode, playerId }) => {
      if (!playerId) return;
      socket.playerId = playerId;

      let roomId = generateRoomId();
      while (rooms.has(roomId)) {
        roomId = generateRoomId();
      }

      const isLudo = gameType === "ludo";
      const board = isLudo ? [] : Array(boardSize * boardSize).fill(null);
      const targetWins = isLudo ? 1 : seriesToWins(seriesMode);

      const room = {
        roomId,
        gameType: gameType || "tictactoe",
        maxPlayers: isLudo ? (maxPlayers || 4) : 2,
        status: "waiting",
        settings: {
          boardSize: isLudo ? 15 : boardSize,
          seriesMode: isLudo ? 1 : seriesMode,
          bestOf: isLudo ? 1 : seriesMode,
          targetWins,
        },
        players: [
          {
            playerId,
            socketId: socket.id,
            name: name || "Host",
            symbol: isLudo ? "red" : "O",
            isHost: true,
            isConnected: true,
            isReady: isLudo ? true : undefined,
          },
        ],
        board,
        currentPlayer: isLudo ? "red" : "O",
        scores: isLudo ? { red: 0, green: 0, yellow: 0, blue: 0 } : { X: 0, O: 0, D: 0 },
        seriesWins: isLudo ? { red: 0, green: 0, yellow: 0, blue: 0 } : { X: 0, O: 0 },
        
        currentRound: 1,
        maxRounds: isLudo ? 1 : seriesMode,
        seriesScoreX: 0,
        seriesScoreO: 0,
        seriesWinner: null,
        roundOver: false,
        roundWinner: null,
        isGameOver: false,
        winResult: null,
        moveCount: 0,
        history: [],
        isSeriesComplete: false,
        rematchRequests: [],
        chatHistory: [],
        ludoState: null,
      };

      if (isLudo) {
        initializeLudoState(room, room.maxPlayers);
      }

      room.createdAt = new Date();
      rooms.set(roomId, room);
      playerRooms.set(playerId, roomId);
      socket.join(roomId);

      // System notification
      addChatMessage(room, "system", "System", `🚪 Room ${roomId} created by ${room.players[0].name}`, "system", "join");

      socket.emit("roomCreated", room);
      console.log(`[ROOM CREATED] Room ID: ${roomId} | Game: ${room.gameType} | Max Players: ${room.maxPlayers} | Host: ${name} (ID: ${playerId}) | Socket ID: ${socket.id}`);
    });

    // Join Room
    socket.on("joinRoom", ({ name, roomId, playerId }) => {
      if (!playerId || !roomId) return;
      socket.playerId = playerId;

      const cleanRoomId = roomId.trim().toUpperCase();
      const room = rooms.get(cleanRoomId);

      if (!room) {
        console.warn(`[JOIN FAILED] Room not found: ${cleanRoomId} by Player: ${name} (ID: ${playerId})`);
        socket.emit("errorMsg", "Room not found. Please verify the Code.");
        return;
      }

      const isLudo = room.gameType === "ludo";
      const maxLimit = room.maxPlayers || 2;

      // Check if player is rejoining
      const existingPlayer = room.players.find((p) => p.playerId === playerId);
      if (existingPlayer) {
        existingPlayer.socketId = socket.id;
        existingPlayer.isConnected = true;
        playerRooms.set(playerId, cleanRoomId);
        socket.join(cleanRoomId);
        
        if (reconnectTimers.has(playerId)) {
          clearTimeout(reconnectTimers.get(playerId));
          reconnectTimers.delete(playerId);
        }

        addChatMessage(room, "system", "System", `⚡ ${existingPlayer.name} reconnected.`, "system", "reconnect");
        socket.emit("roomJoined", room);
        io.to(cleanRoomId).emit("roomUpdated", room);
        console.log(`[PLAYER RECONNECTED] Player: ${name} (ID: ${playerId}) reconnected to Room: ${cleanRoomId} | Socket ID: ${socket.id}`);
        
        // Resume turn timer if playing
        if (isLudo && room.status === "playing") {
          startLudoTurnTimer(cleanRoomId, io);
        }
        return;
      }

      if (room.players.length >= maxLimit) {
        console.warn(`[JOIN FAILED] Room ${cleanRoomId} is already full (Limit: ${maxLimit}). Player: ${name} (ID: ${playerId})`);
        socket.emit("errorMsg", "Room is already full.");
        return;
      }

      if (room.status === "playing" || room.status === "finished") {
        console.warn(`[JOIN FAILED] Room ${cleanRoomId} match already in progress. Player: ${name} (ID: ${playerId})`);
        socket.emit("errorMsg", "Match is already in progress.");
        return;
      }

      let assignedSymbol = "X";
      if (isLudo) {
        const usedSymbols = room.players.map((p) => p.symbol);
        const allColors = LUDO_COLORS.slice(0, room.maxPlayers);
        assignedSymbol = allColors.find((c) => !usedSymbols.includes(c)) || "red";
      } else {
        const hostPlayer = room.players[0];
        assignedSymbol = hostPlayer.symbol === "O" ? "X" : "O";
      }

      const newPlayer = {
        playerId,
        socketId: socket.id,
        name: name || "Guest",
        symbol: assignedSymbol,
        isHost: false,
        isConnected: true,
        isReady: isLudo ? false : undefined,
      };

      room.players.push(newPlayer);
      
      // Auto-start TTT, but Ludo requires ready-up lobby
      if (!isLudo) {
        room.status = "playing";
      }

      playerRooms.set(playerId, cleanRoomId);
      socket.join(cleanRoomId);

      addChatMessage(room, "system", "System", `🚪 ${newPlayer.name} joined as ${assignedSymbol.toUpperCase()}`, "system", "join");

      socket.emit("roomJoined", room);
      io.to(cleanRoomId).emit("roomUpdated", room);
      console.log(`[PLAYER JOINED] Player: ${name} (ID: ${playerId}) joined Room: ${cleanRoomId} as Symbol: ${assignedSymbol} | Socket ID: ${socket.id}`);

      if (!isLudo) {
        console.log(`[GAME STARTED] Tic-Tac-Toe Game started in Room: ${cleanRoomId}`);
      }
    });

    // Rejoin Room Request (Handles page refresh reconnects)
    socket.on("rejoinRoom", ({ roomId, playerId }) => {
      if (!roomId || !playerId) return;
      socket.playerId = playerId;

      const cleanRoomId = roomId.toUpperCase();
      const room = rooms.get(cleanRoomId);

      if (room) {
        const player = room.players.find((p) => p.playerId === playerId);
        if (player) {
          player.socketId = socket.id;
          player.isConnected = true;
          playerRooms.set(playerId, cleanRoomId);
          socket.join(cleanRoomId);
          
          if (reconnectTimers.has(playerId)) {
            clearTimeout(reconnectTimers.get(playerId));
            reconnectTimers.delete(playerId);
          }

          addChatMessage(room, "system", "System", `⚡ ${player.name} reconnected.`, "system", "reconnect");
          socket.emit("rejoinedRoomSuccess", room);
          io.to(cleanRoomId).emit("roomUpdated", room);
          console.log(`[PLAYER REJOINED] Player: ${player.name} (ID: ${playerId}) rejoined Room: ${cleanRoomId} | Socket ID: ${socket.id}`);

          if (room.gameType === "ludo" && room.status === "playing") {
            startLudoTurnTimer(cleanRoomId, io);
          }
        } else {
          console.warn(`[REJOIN FAILED] Player ID: ${playerId} not found in Room: ${cleanRoomId}`);
          socket.emit("rejoinFailed", "Player details not found in room.");
        }
      } else {
        console.warn(`[REJOIN FAILED] Room: ${cleanRoomId} does not exist for Player: ${playerId}`);
        socket.emit("rejoinFailed", "Room does not exist.");
      }
    });

    // Make Move (TTT Server-authoritative validation)
    socket.on("makeMove", ({ roomId, index, playerId }) => {
      const room = rooms.get(roomId);
      if (!room || room.status !== "playing" || room.isGameOver || room.roundOver) return;

      const player = room.players.find((p) => p.playerId === playerId);
      if (!player) return;

      if (room.currentPlayer !== player.symbol) {
        socket.emit("errorMsg", "Not your turn.");
        return;
      }

      if (room.board[index] !== null) {
        socket.emit("errorMsg", "Cell is already taken.");
        return;
      }

      room.board[index] = player.symbol;
      const move = { index, player: player.symbol, timestamp: Date.now() };
      room.history.push(move);
      room.moveCount += 1;

      // Evaluate TTT Win/Draw
      const size = room.settings.boardSize;
      const k = winLengthForSize(size);
      const patterns = generateWinPatterns(size, k);
      const win = checkWinner(room.board, patterns);
      const draw = !win && isDraw(room.board);

      if (win) {
        room.scores[win.winner] += 1;
        room.seriesWins[win.winner] += 1;
        
        room.seriesScoreX = room.seriesWins.X;
        room.seriesScoreO = room.seriesWins.O;

        const isSeriesComplete = room.seriesWins[win.winner] >= room.settings.targetWins;
        if (isSeriesComplete) {
          room.isGameOver = true;
          room.isSeriesComplete = true;
          room.seriesWinner = win.winner;
          room.winResult = { winner: win.winner, pattern: win.pattern };
          room.status = "finished";
          
          addChatMessage(room, "system", "System", `🏁 Series Completed! Champion is ${player.name}`, "system", "game_event");
          
          io.to(roomId).emit("roomUpdated", room);
          console.log(`Series completed in Room ${roomId}. Winner: ${win.winner}`);
        } else {
          room.roundOver = true;
          room.roundWinner = win.winner;
          room.winResult = { winner: win.winner, pattern: win.pattern };
          room.isGameOver = true;

          addChatMessage(room, "system", "System", `🏁 Round ${room.currentRound} won by ${player.name}`, "system", "game_event");

          io.to(roomId).emit("roomUpdated", room);
          console.log(`Round completed in Room ${roomId}. Winner: ${win.winner}`);
          
          setTimeout(() => {
            const freshRoom = rooms.get(roomId);
            if (freshRoom && freshRoom.roundOver) {
              freshRoom.roundOver = false;
              freshRoom.roundWinner = null;
              freshRoom.winResult = null;
              freshRoom.isGameOver = false;
              freshRoom.board = Array(freshRoom.settings.boardSize * freshRoom.settings.boardSize).fill(null);
              freshRoom.moveCount = 0;
              freshRoom.history = [];
              freshRoom.currentRound += 1;
              freshRoom.currentPlayer = Math.random() < 0.5 ? "O" : "X";
              
              io.to(roomId).emit("roomUpdated", freshRoom);
              console.log(`Auto-started next round (Round ${freshRoom.currentRound}) in Room ${roomId}`);
            }
          }, 2500);
        }
      } else if (draw) {
        room.scores.D += 1;
        room.roundOver = true;
        room.roundWinner = "draw";
        room.winResult = null;
        room.isGameOver = true;

        addChatMessage(room, "system", "System", `🏁 Round ${room.currentRound} ended in a Draw.`, "system", "game_event");

        io.to(roomId).emit("roomUpdated", room);
        console.log(`Round completed as a draw in Room ${roomId}`);
        
        setTimeout(() => {
          const freshRoom = rooms.get(roomId);
          if (freshRoom && freshRoom.roundOver) {
            freshRoom.roundOver = false;
            freshRoom.roundWinner = null;
            freshRoom.winResult = null;
            freshRoom.isGameOver = false;
            freshRoom.board = Array(freshRoom.settings.boardSize * freshRoom.settings.boardSize).fill(null);
            freshRoom.moveCount = 0;
            freshRoom.history = [];
            freshRoom.currentRound += 1;
            freshRoom.currentPlayer = Math.random() < 0.5 ? "O" : "X";
            
            io.to(roomId).emit("roomUpdated", freshRoom);
            console.log(`Auto-started next round (Round ${freshRoom.currentRound}) in Room ${roomId} after draw`);
          }
        }, 2500);
      } else {
        room.currentPlayer = room.currentPlayer === "O" ? "X" : "O";
        io.to(roomId).emit("roomUpdated", room);
      }

      console.log(`Move made in Room ${roomId} at index ${index} by ${player.name} (${player.symbol})`);
    });

    // Ludo Toggle Ready
    socket.on("ludoToggleReady", ({ roomId, playerId, isReady }) => {
      const room = rooms.get(roomId);
      if (!room || room.gameType !== "ludo") return;

      const player = room.players.find((p) => p.playerId === playerId);
      if (!player) return;

      player.isReady = isReady;
      addChatMessage(room, "system", "System", `👍 ${player.name} is ${isReady ? "Ready" : "Not Ready"}`, "system", "game_event");

      io.to(roomId).emit("roomUpdated", room);
      console.log(`Player ${player.name} ready status in room ${roomId}: ${isReady}`);
    });

    // Ludo Start Game
    socket.on("ludoStartGame", ({ roomId, playerId }) => {
      const room = rooms.get(roomId);
      if (!room || room.gameType !== "ludo") return;

      const player = room.players.find((p) => p.playerId === playerId);
      if (!player || !player.isHost) return;

      if (room.players.length < 2) {
        socket.emit("errorMsg", "Need at least 2 players to start.");
        return;
      }

      const allReady = room.players.every((p) => p.isReady);
      if (!allReady) {
        socket.emit("errorMsg", "Not all players are ready.");
        return;
      }

      room.status = "playing";
      room.ludoState.isGameStarted = true;
      
      addChatMessage(room, "system", "System", `🎮 Game started! Red's turn.`, "system", "game_event");
      io.to(roomId).emit("roomUpdated", room);
      
      startLudoTurnTimer(roomId, io);
      console.log(`Ludo game started in Room ${roomId}`);
    });

    // Ludo Roll Dice
    socket.on("ludoRollDice", ({ roomId, playerId }) => {
      const room = rooms.get(roomId);
      if (!room || room.status !== "playing" || room.gameType !== "ludo") return;

      const player = room.players.find((p) => p.playerId === playerId);
      if (!player) return;

      if (room.currentPlayer !== player.symbol) {
        socket.emit("errorMsg", "Not your turn.");
        return;
      }

      if (room.ludoState.hasRolled) {
        socket.emit("errorMsg", "Already rolled dice.");
        return;
      }

      const roll = Math.floor(Math.random() * 6) + 1;
      room.ludoState.diceRoll = roll;
      room.ludoState.hasRolled = true;

      addChatMessage(room, "system", "System", `🎲 ${player.name} rolled a ${roll}!`, "system", "game_event");

      const validMoves = getValidMoves(player.symbol, roll, room.ludoState.tokens);
      
      if (validMoves.length === 0) {
        addChatMessage(room, "system", "System", `⚠️ No valid moves for ${player.name}. Turn passing...`, "system", "game_event");
        
        io.to(roomId).emit("roomUpdated", room);
        
        setTimeout(() => {
          const freshRoom = rooms.get(roomId);
          if (freshRoom && freshRoom.status === "playing" && freshRoom.currentPlayer === player.symbol && freshRoom.ludoState.hasRolled) {
            advanceLudoTurn(freshRoom);
            io.to(roomId).emit("roomUpdated", freshRoom);
            startLudoTurnTimer(roomId, io);
          }
        }, 1500);
      } else {
        io.to(roomId).emit("roomUpdated", room);
        startLudoTurnTimer(roomId, io);
      }

      console.log(`Ludo Roll: ${player.name} rolled ${roll} in Room ${roomId}`);
    });

    // Ludo Move Token
    socket.on("ludoMoveToken", ({ roomId, playerId, tokenIndex }) => {
      const room = rooms.get(roomId);
      if (!room || room.status !== "playing" || room.gameType !== "ludo") return;

      const player = room.players.find((p) => p.playerId === playerId);
      if (!player) return;

      if (room.currentPlayer !== player.symbol) {
        socket.emit("errorMsg", "Not your turn.");
        return;
      }

      if (!room.ludoState.hasRolled) {
        socket.emit("errorMsg", "Roll dice first.");
        return;
      }

      const roll = room.ludoState.diceRoll;
      const validMoves = getValidMoves(player.symbol, roll, room.ludoState.tokens);
      
      if (!validMoves.includes(tokenIndex)) {
        socket.emit("errorMsg", "Invalid token move selection.");
        return;
      }

      executeLudoMove(room, player.symbol, tokenIndex);
      io.to(roomId).emit("roomUpdated", room);
      
      if (room.status === "playing") {
        startLudoTurnTimer(roomId, io);
      }
      console.log(`Ludo Move: ${player.name} moved token ${tokenIndex} in Room ${roomId}`);
    });

    // Send Chat Message
    socket.on("sendMessage", ({ roomId, content, playerId }) => {
      const room = rooms.get(roomId);
      if (!room || !content || !playerId) return;

      const player = room.players.find((p) => p.playerId === playerId);
      if (!player) return;

      const msg = addChatMessage(room, playerId, player.name, content, "chat");
      
      io.to(roomId).emit("roomUpdated", room);
      io.to(roomId).emit("newMessage", msg);
      console.log(`Chat in ${roomId} from ${player.name}: ${content}`);
    });

    // Typing State
    socket.on("typingState", ({ roomId, playerId, isTyping }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const player = room.players.find((p) => p.playerId === playerId);
      if (player) {
        socket.to(roomId).emit("typingStateUpdated", { playerId, name: player.name, isTyping });
      }
    });

    // Rematch Request
    socket.on("requestRematch", ({ roomId, playerId }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const player = room.players.find((p) => p.playerId === playerId);
      if (!player) return;

      if (!room.rematchRequests.includes(playerId)) {
        room.rematchRequests.push(playerId);
      }

      io.to(roomId).emit("roomUpdated", room);

      if (room.rematchRequests.length === room.players.length && room.players.length >= 2) {
        room.rematchRequests = [];
        room.isGameOver = false;
        room.winResult = null;
        room.moveCount = 0;
        room.history = [];
        room.status = "playing";

        if (room.gameType === "ludo") {
          initializeLudoState(room, room.maxPlayers);
          room.ludoState.isGameStarted = true;
          addChatMessage(room, "system", "System", `🔄 Rematch started! Red's turn.`, "system", "game_event");
          startLudoTurnTimer(roomId, io);
        } else {
          room.board = Array(room.settings.boardSize * room.settings.boardSize).fill(null);
          room.scores = { X: 0, O: 0, D: 0 };
          room.seriesWins = { X: 0, O: 0 };
          room.isSeriesComplete = false;
          room.seriesWinner = null;
          room.currentRound = 1;
          room.seriesScoreX = 0;
          room.seriesScoreO = 0;
          room.currentPlayer = Math.random() < 0.5 ? "O" : "X";
          addChatMessage(room, "system", "System", `🔄 Rematch started! TTT Series initialized.`, "system", "game_event");
        }

        io.to(roomId).emit("rematchStarted", room);
        io.to(roomId).emit("roomUpdated", room);
        console.log(`Rematch started in Room ${roomId}. Game state reset.`);
      }
    });

    // Decline Rematch
    socket.on("declineRematch", ({ roomId, playerId }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      room.rematchRequests = [];
      io.to(roomId).emit("roomUpdated", room);
      io.to(roomId).emit("rematchDeclined", { playerId });
      console.log(`Rematch declined in Room ${roomId} by ${playerId}`);
    });

    // WebRTC targeted multi-peer voice signaling
    socket.on("voiceSignal", ({ roomId, targetPlayerId, signal }) => {
      const room = rooms.get(roomId);
      if (room) {
        const target = room.players.find((p) => p.playerId === targetPlayerId);
        if (target && target.socketId) {
          io.to(target.socketId).emit("voiceSignal", { senderPlayerId: socket.playerId, signal });
        }
      }
    });

    socket.on("voiceStateUpdate", ({ roomId, micActive, speaking }) => {
      socket.to(roomId).emit("voiceStateUpdate", { playerId: socket.playerId, micActive, speaking });
    });

    // Explicit Leave Room
    socket.on("leaveRoom", ({ roomId, playerId }) => {
      if (!roomId || !playerId) return;
      const cleanRoomId = roomId.toUpperCase();
      const room = rooms.get(cleanRoomId);
      if (!room) return;

      console.log(`[PLAYER LEAVE] Player ID: ${playerId} explicitly leaving Room: ${cleanRoomId}`);

      if (reconnectTimers.has(playerId)) {
        clearTimeout(reconnectTimers.get(playerId));
        reconnectTimers.delete(playerId);
      }

      const leavingPlayer = room.players.find((p) => p.playerId === playerId);
      room.players = room.players.filter((p) => p.playerId !== playerId);
      playerRooms.delete(playerId);
      socket.leave(cleanRoomId);

      if (leavingPlayer) {
        addChatMessage(room, "system", "System", `🚪 ${leavingPlayer.name} left the room.`, "system", "leave");
      }

      if (room.players.length === 0) {
        rooms.delete(cleanRoomId);
        if (ludoTurnTimers.has(cleanRoomId)) {
          clearTimeout(ludoTurnTimers.get(cleanRoomId));
          ludoTurnTimers.delete(cleanRoomId);
        }
        console.log(`[ROOM DELETED] Room ${cleanRoomId} deleted because it became empty.`);
      } else {
        const isLudo = room.gameType === "ludo";
        
        if (room.status === "playing") {
          if (isLudo) {
            const connectedPlayers = room.players.filter((p) => p.isConnected);
            if (connectedPlayers.length < 2) {
              room.status = "finished";
              room.isGameOver = true;
              room.isSeriesComplete = true;
              room.ludoState.winner = connectedPlayers[0]?.symbol || room.players[0].symbol;
              room.seriesWinner = room.ludoState.winner;

              addChatMessage(room, "system", "System", `🏁 Game Over! Other players left. Winner is ${room.players.find(p => p.symbol === room.seriesWinner)?.name || room.seriesWinner}`, "system", "game_event");

              if (ludoTurnTimers.has(cleanRoomId)) {
                clearTimeout(ludoTurnTimers.get(cleanRoomId));
                ludoTurnTimers.delete(cleanRoomId);
              }
            } else {
              if (room.currentPlayer === leavingPlayer?.symbol) {
                advanceLudoTurn(room);
                startLudoTurnTimer(cleanRoomId, io);
              }
            }
          } else {
            room.status = "finished";
            room.isGameOver = true;
            room.isSeriesComplete = true;
            room.seriesWinner = room.players[0].symbol;
          }
        }
        
        io.to(cleanRoomId).emit("roomUpdated", room);
        io.to(cleanRoomId).emit("opponentLeftRoom", { playerId });
        console.log(`[PLAYER LEAVE] Player ID: ${playerId} left Room: ${cleanRoomId}`);
      }
    });

    // Disconnect handler
    socket.on("disconnect", () => {
      console.log(`[SOCKET DISCONNECTED] Socket ID: ${socket.id} | Player ID: ${socket.playerId || "unregistered"}`);
      
      const playerId = socket.playerId;
      if (!playerId) return;

      const roomId = playerRooms.get(playerId);
      if (!roomId) return;

      const room = rooms.get(roomId);
      if (!room) return;

      const player = room.players.find((p) => p.playerId === playerId);
      if (player) {
        player.isConnected = false;

        // ── Word Battle Disconnect Handling ──
        if (room.gameType === "wordbattle") {
          io.to(roomId).emit("word:room-updated", room);
          console.log(`[WORD BATTLE DISCONNECTED] Player: ${player.name} (ID: ${playerId}) from Room: ${roomId}`);

          const timer = setTimeout(() => {
            const freshRoom = rooms.get(roomId);
            if (!freshRoom || freshRoom.gameType !== "wordbattle") return;

            const activePlayers = freshRoom.players.filter((p) => p.isConnected);
            if (activePlayers.length === 0) {
              rooms.delete(roomId);
              console.log(`[WORD BATTLE ROOM DELETED] Room ${roomId} emptied after disconnect expiry.`);
            } else {
              freshRoom.players = freshRoom.players.filter((p) => p.playerId !== playerId);
              if (freshRoom.status === "playing" && !freshRoom.winnerId) {
                const remaining = freshRoom.players[0];
                if (remaining) {
                  freshRoom.winnerId = remaining.playerId;
                  freshRoom.status = "finished";
                }
              }
              io.to(roomId).emit("word:room-updated", freshRoom);
              io.to(roomId).emit("word:opponent-left", { playerId });
              console.log(`[WORD BATTLE ROOM UPDATED] Room ${roomId} updated after disconnect expiry.`);
            }
            reconnectTimers.delete(playerId);
          }, 30000);

          reconnectTimers.set(playerId, timer);
          return;
        }

        // ── Standard (TTT / Ludo) Disconnect Handling ──
        addChatMessage(room, "system", "System", `⚠️ ${player.name} disconnected.`, "system", "disconnect");
        io.to(roomId).emit("roomUpdated", room);
        console.log(`[PLAYER DISCONNECTED] Player: ${player.name} (ID: ${playerId}) disconnected from Room: ${roomId}`);

        // Start 30 second grace period for reconnects
        const timer = setTimeout(() => {
          console.log(`[DISCONNECT EXPIRED] Reconnect grace period expired for Player ID: ${playerId} in Room: ${roomId}`);
          
          const freshRoom = rooms.get(roomId);
          if (freshRoom) {
            const activePlayers = freshRoom.players.filter((p) => p.isConnected);
            if (activePlayers.length === 0) {
              rooms.delete(roomId);
              if (ludoTurnTimers.has(roomId)) {
                clearTimeout(ludoTurnTimers.get(roomId));
                ludoTurnTimers.delete(roomId);
              }
              console.log(`[ROOM DELETED] Room ${roomId} deleted due to inactivity after player disconnect.`);
            } else {
              const isLudo = freshRoom.gameType === "ludo";
              if (isLudo) {
                freshRoom.players = freshRoom.players.filter((p) => p.playerId !== playerId);
                addChatMessage(freshRoom, "system", "System", `🚪 ${player.name} was removed from the match.`, "system", "leave");

                const connected = freshRoom.players.filter((p) => p.isConnected);
                if (connected.length < 2 && freshRoom.status === "playing") {
                  freshRoom.status = "finished";
                  freshRoom.isGameOver = true;
                  freshRoom.isSeriesComplete = true;
                  freshRoom.ludoState.winner = connected[0]?.symbol || freshRoom.players[0].symbol;
                  freshRoom.seriesWinner = freshRoom.ludoState.winner;
                  
                  addChatMessage(freshRoom, "system", "System", `🏁 Game Over! Winner: ${freshRoom.players.find(p => p.symbol === freshRoom.seriesWinner)?.name || freshRoom.seriesWinner}`, "system", "game_event");

                  if (ludoTurnTimers.has(roomId)) {
                    clearTimeout(ludoTurnTimers.get(roomId));
                    ludoTurnTimers.delete(roomId);
                  }
                } else if (freshRoom.status === "playing" && freshRoom.currentPlayer === player.symbol) {
                  advanceLudoTurn(freshRoom);
                  startLudoTurnTimer(roomId, io);
                }
              } else {
                freshRoom.status = "finished";
                freshRoom.isGameOver = true;
                freshRoom.isSeriesComplete = true;
                freshRoom.seriesWinner = activePlayers[0].symbol;
              }
              
              io.to(roomId).emit("roomUpdated", freshRoom);
              console.log(`[ROOM UPDATED] Room ${roomId} status updated due to player disconnect expiry.`);
            }
          }
          reconnectTimers.delete(playerId);
        }, 30000);

        reconnectTimers.set(playerId, timer);
      }
    });
  });
}

module.exports = {
  registerSocketHandlers,
};
