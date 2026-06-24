// ============================================================
// useOnlineSocket Hook — Socket.io Synchronization & State Bindings
// ============================================================

"use client";

import { useEffect, useCallback, useRef } from "react";
import { useGameStore } from "@/store/gameStore";
import { generateId } from "@/shared/services/utils";
import { useSound } from "@/shared/hooks/useSound";
import type { BoardSize, SeriesMode, OnlineRoom } from "@/shared/types/game";
import { getSocket } from "@/shared/services/socket/socketClient";
import { SOCKET_EVENTS } from "@/shared/services/socket/socketEvents";

let roomCreatedCallback: ((roomId: string, gameType: string) => void) | null = null;
let roomJoinedCallback: ((roomId: string, gameType: string) => void) | null = null;
let errorCallback: ((msg: string) => void) | null = null;

export function useOnlineSocket() {
  const onlinePlayerId = useGameStore((s) => s.onlinePlayerId);
  const setOnlinePlayerId = useGameStore((s) => s.setOnlinePlayerId);
  const setOnOnlineMove = useGameStore((s) => s.setOnOnlineMove);
  
  const { playError } = useSound();
  const playErrorRef = useRef(playError);

  useEffect(() => {
    playErrorRef.current = playError;
  }, [playError]);

  // Initialize Player ID if not set
  useEffect(() => {
    let currentId = onlinePlayerId;
    if (!currentId && typeof window !== "undefined") {
      currentId = sessionStorage.getItem("ggh-player-id");
      if (!currentId) {
        currentId = `player-${generateId()}`;
        sessionStorage.setItem("ggh-player-id", currentId);
      }
      setOnlinePlayerId(currentId);
    }
  }, [onlinePlayerId, setOnlinePlayerId]);

  // Connect socket.io singleton (Runs exactly once in app lifecycle)
  // IMPORTANT: No reactive dependencies — this function must be referentially stable
  // to prevent room page useEffect cleanups from firing spuriously.
  const connect = useCallback(() => {
    const socketInstance = getSocket();

    if (socketInstance.connected) return socketInstance;

    socketInstance.off(SOCKET_EVENTS.CONNECT);
    socketInstance.off(SOCKET_EVENTS.CONNECT_ERROR);
    socketInstance.off(SOCKET_EVENTS.ROOM_CREATED);
    socketInstance.off(SOCKET_EVENTS.ROOM_JOINED);
    socketInstance.off(SOCKET_EVENTS.REJOINED_ROOM_SUCCESS);
    socketInstance.off(SOCKET_EVENTS.ROOM_UPDATED);
    socketInstance.off(SOCKET_EVENTS.REMATCH_STARTED);
    socketInstance.off(SOCKET_EVENTS.ERROR_MSG);
    socketInstance.off(SOCKET_EVENTS.REJOIN_FAILED);
    socketInstance.off(SOCKET_EVENTS.TYPING_STATE_UPDATED);

    socketInstance.on(SOCKET_EVENTS.CONNECT, () => {
      console.log("Socket connected to server:", socketInstance.id);
      const { onlinePlayerId } = useGameStore.getState();
      if (onlinePlayerId) {
        socketInstance.emit(SOCKET_EVENTS.REGISTER_PLAYER, { playerId: onlinePlayerId });
      }
    });

    socketInstance.on(SOCKET_EVENTS.CONNECT_ERROR, (err) => {
      console.error("Socket connection error:", err.message);
    });

    socketInstance.on(SOCKET_EVENTS.ROOM_CREATED, (room: OnlineRoom) => {
      const { setOnlineRoom, setOnlinePlayerSymbol, onlinePlayerId } = useGameStore.getState();
      setOnlineRoom(room);
      const host = room.players.find((p) => p.playerId === onlinePlayerId);
      if (host) {
        setOnlinePlayerSymbol(host.symbol);
      }
      if (roomCreatedCallback) {
        const cb = roomCreatedCallback;
        roomCreatedCallback = null;
        cb(room.roomId, room.gameType || "tictactoe");
      }
    });

    socketInstance.on(SOCKET_EVENTS.ROOM_JOINED, (room: OnlineRoom) => {
      const { setOnlineRoom, setOnlinePlayerSymbol, updateFromOnlineRoom, onlinePlayerId } = useGameStore.getState();
      setOnlineRoom(room);
      const player = room.players.find((p) => p.playerId === onlinePlayerId);
      if (player) {
        setOnlinePlayerSymbol(player.symbol);
      }
      updateFromOnlineRoom(room);
      if (roomJoinedCallback) {
        const cb = roomJoinedCallback;
        roomJoinedCallback = null;
        cb(room.roomId, room.gameType || "tictactoe");
      }
    });

    socketInstance.on(SOCKET_EVENTS.REJOINED_ROOM_SUCCESS, (room: OnlineRoom) => {
      const { setOnlineRoom, setOnlinePlayerSymbol, updateFromOnlineRoom, onlinePlayerId } = useGameStore.getState();
      setOnlineRoom(room);
      const player = room.players.find((p) => p.playerId === onlinePlayerId);
      if (player) {
        setOnlinePlayerSymbol(player.symbol);
      }
      updateFromOnlineRoom(room);
    });

    socketInstance.on(SOCKET_EVENTS.ROOM_UPDATED, (room: OnlineRoom) => {
      const { updateFromOnlineRoom } = useGameStore.getState();
      updateFromOnlineRoom(room);
    });

    socketInstance.on(SOCKET_EVENTS.REMATCH_STARTED, (room: OnlineRoom) => {
      const { updateFromOnlineRoom } = useGameStore.getState();
      updateFromOnlineRoom(room);
    });

    socketInstance.on(SOCKET_EVENTS.ERROR_MSG, (msg) => {
      playErrorRef.current();
      if (errorCallback) {
        const cb = errorCallback;
        errorCallback = null;
        cb(msg);
      } else {
        alert(msg);
      }
    });

    socketInstance.on(SOCKET_EVENTS.REJOIN_FAILED, (msg) => {
      console.warn("Rejoin failed:", msg);
      const { setOnlineRoom } = useGameStore.getState();
      setOnlineRoom(null);
      if (typeof window !== "undefined") {
        alert("Room connection failed: " + msg);
        window.location.href = "/online";
      }
    });

    // Chat typing listeners
    socketInstance.on(SOCKET_EVENTS.TYPING_STATE_UPDATED, ({ playerId, isTyping }) => {
      useGameStore.setState((state) => {
        const next = { ...state.typingPlayers };
        if (isTyping) {
          next[playerId] = true;
        } else {
          delete next[playerId];
        }
        return { typingPlayers: next };
      });
    });

    return socketInstance;
  }, []);

  // Handle register update when playerId changes
  useEffect(() => {
    const socketInstance = getSocket();
    if (socketInstance.connected && onlinePlayerId) {
      socketInstance.emit(SOCKET_EVENTS.REGISTER_PLAYER, { playerId: onlinePlayerId });
    }
  }, [onlinePlayerId]);

  // Create Room action (Polymorphic compatibility)
  const createRoom = useCallback((
    name: string,
    arg2: unknown,
    arg3?: unknown,
    arg4?: unknown,
    arg5?: unknown,
    arg6?: unknown
  ) => {
    const s = connect();
    const { onlinePlayerId } = useGameStore.getState();

    let gameType = "tictactoe";
    let maxPlayers = 2;
    let boardSize: BoardSize = 3;
    let seriesMode: SeriesMode = 3;
    let callback: ((roomId: string, gameType: string) => void) | undefined;

    if (typeof arg2 === "string") {
      gameType = arg2;
      maxPlayers = arg3 as number;
      boardSize = arg4 as BoardSize;
      seriesMode = arg5 as SeriesMode;
      callback = arg6 as ((roomId: string, gameType: string) => void) | undefined;
    } else {
      boardSize = arg2 as BoardSize;
      seriesMode = arg3 as SeriesMode;
      callback = arg4 as ((roomId: string, gameType: string) => void) | undefined;
    }

    if (callback) roomCreatedCallback = callback;
    s.emit(SOCKET_EVENTS.CREATE_ROOM, {
      name,
      gameType,
      maxPlayers,
      boardSize,
      seriesMode,
      playerId: onlinePlayerId,
    });
  }, [connect]);

  // Join Room action
  const joinRoom = useCallback((name: string, roomId: string, onJoined?: (roomId: string, gameType: string) => void, onError?: (msg: string) => void) => {
    const s = connect();
    const { onlinePlayerId } = useGameStore.getState();
    if (onJoined) roomJoinedCallback = onJoined;
    if (onError) errorCallback = onError;
    s.emit(SOCKET_EVENTS.JOIN_ROOM, { name, roomId, playerId: onlinePlayerId });
  }, [connect]);

  // Rejoin Room (for page refresh reconnect)
  const rejoinRoom = useCallback((roomId: string) => {
    const s = connect();
    const { onlinePlayerId } = useGameStore.getState();
    s.emit(SOCKET_EVENTS.REJOIN_ROOM, { roomId, playerId: onlinePlayerId });
  }, [connect]);

  // Make Move action (TTT)
  const sendMove = useCallback((index: number) => {
    const socketInstance = getSocket();
    const { onlineRoomId, onlinePlayerId } = useGameStore.getState();
    if (!onlineRoomId) return;
    socketInstance.emit(SOCKET_EVENTS.MAKE_MOVE, { roomId: onlineRoomId, index, playerId: onlinePlayerId });
  }, []);

  // Request Rematch action
  const sendRematchRequest = useCallback(() => {
    const socketInstance = getSocket();
    const { onlineRoomId, onlinePlayerId } = useGameStore.getState();
    if (!onlineRoomId) return;
    socketInstance.emit(SOCKET_EVENTS.REQUEST_REMATCH, { roomId: onlineRoomId, playerId: onlinePlayerId });
  }, []);

  // Decline Rematch action
  const declineRematch = useCallback(() => {
    const socketInstance = getSocket();
    const { onlineRoomId, onlinePlayerId } = useGameStore.getState();
    if (!onlineRoomId) return;
    socketInstance.emit(SOCKET_EVENTS.DECLINE_REMATCH, { roomId: onlineRoomId, playerId: onlinePlayerId });
  }, []);

  // Leave Room action
  const leaveRoom = useCallback(() => {
    const socketInstance = getSocket();
    const { onlineRoomId, onlinePlayerId, setOnlineRoom } = useGameStore.getState();
    if (!onlineRoomId) return;
    socketInstance.emit(SOCKET_EVENTS.LEAVE_ROOM, { roomId: onlineRoomId, playerId: onlinePlayerId });
    setOnlineRoom(null);
  }, []);

  // Ludo specific events
  const sendLudoReadyState = useCallback((isReady: boolean) => {
    const socketInstance = getSocket();
    const { onlineRoomId, onlinePlayerId } = useGameStore.getState();
    if (!onlineRoomId) return;
    socketInstance.emit(SOCKET_EVENTS.LUDO_TOGGLE_READY, { roomId: onlineRoomId, playerId: onlinePlayerId, isReady });
  }, []);

  const sendLudoStartGame = useCallback(() => {
    const socketInstance = getSocket();
    const { onlineRoomId, onlinePlayerId } = useGameStore.getState();
    if (!onlineRoomId) return;
    socketInstance.emit(SOCKET_EVENTS.LUDO_START_GAME, { roomId: onlineRoomId, playerId: onlinePlayerId });
  }, []);

  const sendLudoRollDice = useCallback(() => {
    const socketInstance = getSocket();
    const { onlineRoomId, onlinePlayerId } = useGameStore.getState();
    if (!onlineRoomId) return;
    socketInstance.emit(SOCKET_EVENTS.LUDO_ROLL_DICE, { roomId: onlineRoomId, playerId: onlinePlayerId });
  }, []);

  const sendLudoMoveToken = useCallback((tokenIndex: number) => {
    const socketInstance = getSocket();
    const { onlineRoomId, onlinePlayerId } = useGameStore.getState();
    if (!onlineRoomId) return;
    socketInstance.emit(SOCKET_EVENTS.LUDO_MOVE_TOKEN, { roomId: onlineRoomId, playerId: onlinePlayerId, tokenIndex });
  }, []);

  // Chat events
  const sendChatMessage = useCallback((content: string) => {
    const socketInstance = getSocket();
    const { onlineRoomId, onlinePlayerId } = useGameStore.getState();
    if (!onlineRoomId) return;
    socketInstance.emit(SOCKET_EVENTS.SEND_MESSAGE, { roomId: onlineRoomId, content, playerId: onlinePlayerId });
  }, []);

  const sendTypingState = useCallback((isTyping: boolean) => {
    const socketInstance = getSocket();
    const { onlineRoomId, onlinePlayerId } = useGameStore.getState();
    if (!onlineRoomId) return;
    socketInstance.emit(SOCKET_EVENTS.TYPING_STATE, { roomId: onlineRoomId, playerId: onlinePlayerId, isTyping });
  }, []);

  // Set move intercept callback in store
  useEffect(() => {
    setOnOnlineMove(sendMove);
    return () => {
      setOnOnlineMove(null);
    };
  }, [sendMove, setOnOnlineMove]);

  const socketInstance = getSocket();

  return {
    connect,
    createRoom,
    joinRoom,
    rejoinRoom,
    sendMove,
    sendRematchRequest,
    declineRematch,
    leaveRoom,
    sendLudoReadyState,
    sendLudoStartGame,
    sendLudoRollDice,
    sendLudoMoveToken,
    sendChatMessage,
    sendTypingState,
    isConnected: socketInstance.connected,
    socket: socketInstance,
  };
}
