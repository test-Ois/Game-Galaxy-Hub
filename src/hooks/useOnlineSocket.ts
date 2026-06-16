// ============================================================
// useOnlineSocket Hook — Socket.io Synchronization & State Bindings
// ============================================================

"use client";

import { useEffect, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useGameStore } from "@/stores/gameStore";
import { generateId } from "@/lib/utils";
import { useSound } from "@/hooks/useSound";
import type { BoardSize, SeriesMode, OnlineRoom } from "@/lib/game/types";

let socketInstance: Socket | null = null;
let roomCreatedCallback: ((roomId: string) => void) | null = null;
let roomJoinedCallback: ((roomId: string) => void) | null = null;
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
    if (socketInstance) return socketInstance;

    const socketUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    
    socketInstance = io(socketUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on("connect", () => {
      console.log("Socket connected to server:", socketInstance?.id);
      const { onlinePlayerId } = useGameStore.getState();
      if (onlinePlayerId) {
        socketInstance?.emit("registerPlayer", { playerId: onlinePlayerId });
      }
    });

    socketInstance.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    socketInstance.on("roomCreated", (room: OnlineRoom) => {
      const { setOnlineRoom, setOnlinePlayerSymbol, onlinePlayerId } = useGameStore.getState();
      setOnlineRoom(room);
      const host = room.players.find((p) => p.playerId === onlinePlayerId);
      if (host) {
        setOnlinePlayerSymbol(host.symbol);
      }
      if (roomCreatedCallback) {
        roomCreatedCallback(room.roomId);
      }
    });

    socketInstance.on("roomJoined", (room: OnlineRoom) => {
      const { setOnlineRoom, setOnlinePlayerSymbol, updateFromOnlineRoom, onlinePlayerId } = useGameStore.getState();
      setOnlineRoom(room);
      const player = room.players.find((p) => p.playerId === onlinePlayerId);
      if (player) {
        setOnlinePlayerSymbol(player.symbol);
      }
      updateFromOnlineRoom(room);
      if (roomJoinedCallback) {
        roomJoinedCallback(room.roomId);
      }
    });

    socketInstance.on("rejoinedRoomSuccess", (room: OnlineRoom) => {
      const { setOnlineRoom, setOnlinePlayerSymbol, updateFromOnlineRoom, onlinePlayerId } = useGameStore.getState();
      setOnlineRoom(room);
      const player = room.players.find((p) => p.playerId === onlinePlayerId);
      if (player) {
        setOnlinePlayerSymbol(player.symbol);
      }
      updateFromOnlineRoom(room);
    });

    socketInstance.on("roomUpdated", (room: OnlineRoom) => {
      const { updateFromOnlineRoom } = useGameStore.getState();
      updateFromOnlineRoom(room);
    });

    socketInstance.on("rematchStarted", (room: OnlineRoom) => {
      const { updateFromOnlineRoom } = useGameStore.getState();
      updateFromOnlineRoom(room);
    });

    socketInstance.on("errorMsg", (msg) => {
      playErrorRef.current();
      if (errorCallback) {
        errorCallback(msg);
      } else {
        alert(msg);
      }
    });

    socketInstance.on("rejoinFailed", (msg) => {
      console.warn("Rejoin failed:", msg);
      const { setOnlineRoom } = useGameStore.getState();
      setOnlineRoom(null);
      if (typeof window !== "undefined") {
        alert("Room connection failed: " + msg);
        window.location.href = "/online";
      }
    });

    // Chat typing listeners
    socketInstance.on("typingStateUpdated", ({ playerId, isTyping }) => {
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
    if (socketInstance && socketInstance.connected && onlinePlayerId) {
      socketInstance.emit("registerPlayer", { playerId: onlinePlayerId });
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
    let callback: ((roomId: string) => void) | undefined;

    if (typeof arg2 === "string") {
      gameType = arg2;
      maxPlayers = arg3 as number;
      boardSize = arg4 as BoardSize;
      seriesMode = arg5 as SeriesMode;
      callback = arg6 as ((roomId: string) => void) | undefined;
    } else {
      boardSize = arg2 as BoardSize;
      seriesMode = arg3 as SeriesMode;
      callback = arg4 as ((roomId: string) => void) | undefined;
    }

    if (callback) roomCreatedCallback = callback;
    s.emit("createRoom", {
      name,
      gameType,
      maxPlayers,
      boardSize,
      seriesMode,
      playerId: onlinePlayerId,
    });
  }, [connect]);

  // Join Room action
  const joinRoom = useCallback((name: string, roomId: string, onJoined?: (roomId: string) => void, onError?: (msg: string) => void) => {
    const s = connect();
    const { onlinePlayerId } = useGameStore.getState();
    if (onJoined) roomJoinedCallback = onJoined;
    if (onError) errorCallback = onError;
    s.emit("joinRoom", { name, roomId, playerId: onlinePlayerId });
  }, [connect]);

  // Rejoin Room (for page refresh reconnect)
  const rejoinRoom = useCallback((roomId: string) => {
    const s = connect();
    const { onlinePlayerId } = useGameStore.getState();
    s.emit("rejoinRoom", { roomId, playerId: onlinePlayerId });
  }, [connect]);

  // Make Move action (TTT)
  const sendMove = useCallback((index: number) => {
    if (!socketInstance) return;
    const { onlineRoomId, onlinePlayerId } = useGameStore.getState();
    if (!onlineRoomId) return;
    socketInstance.emit("makeMove", { roomId: onlineRoomId, index, playerId: onlinePlayerId });
  }, []);

  // Request Rematch action
  const sendRematchRequest = useCallback(() => {
    if (!socketInstance) return;
    const { onlineRoomId, onlinePlayerId } = useGameStore.getState();
    if (!onlineRoomId) return;
    socketInstance.emit("requestRematch", { roomId: onlineRoomId, playerId: onlinePlayerId });
  }, []);

  // Decline Rematch action
  const declineRematch = useCallback(() => {
    if (!socketInstance) return;
    const { onlineRoomId, onlinePlayerId } = useGameStore.getState();
    if (!onlineRoomId) return;
    socketInstance.emit("declineRematch", { roomId: onlineRoomId, playerId: onlinePlayerId });
  }, []);

  // Leave Room action
  const leaveRoom = useCallback(() => {
    if (!socketInstance) return;
    const { onlineRoomId, onlinePlayerId, setOnlineRoom } = useGameStore.getState();
    if (!onlineRoomId) return;
    socketInstance.emit("leaveRoom", { roomId: onlineRoomId, playerId: onlinePlayerId });
    setOnlineRoom(null);
  }, []);

  // Ludo specific events
  const sendLudoReadyState = useCallback((isReady: boolean) => {
    if (!socketInstance) return;
    const { onlineRoomId, onlinePlayerId } = useGameStore.getState();
    if (!onlineRoomId) return;
    socketInstance.emit("ludoToggleReady", { roomId: onlineRoomId, playerId: onlinePlayerId, isReady });
  }, []);

  const sendLudoStartGame = useCallback(() => {
    if (!socketInstance) return;
    const { onlineRoomId, onlinePlayerId } = useGameStore.getState();
    if (!onlineRoomId) return;
    socketInstance.emit("ludoStartGame", { roomId: onlineRoomId, playerId: onlinePlayerId });
  }, []);

  const sendLudoRollDice = useCallback(() => {
    if (!socketInstance) return;
    const { onlineRoomId, onlinePlayerId } = useGameStore.getState();
    if (!onlineRoomId) return;
    socketInstance.emit("ludoRollDice", { roomId: onlineRoomId, playerId: onlinePlayerId });
  }, []);

  const sendLudoMoveToken = useCallback((tokenIndex: number) => {
    if (!socketInstance) return;
    const { onlineRoomId, onlinePlayerId } = useGameStore.getState();
    if (!onlineRoomId) return;
    socketInstance.emit("ludoMoveToken", { roomId: onlineRoomId, playerId: onlinePlayerId, tokenIndex });
  }, []);

  // Chat events
  const sendChatMessage = useCallback((content: string) => {
    if (!socketInstance) return;
    const { onlineRoomId, onlinePlayerId } = useGameStore.getState();
    if (!onlineRoomId) return;
    socketInstance.emit("sendMessage", { roomId: onlineRoomId, content, playerId: onlinePlayerId });
  }, []);

  const sendTypingState = useCallback((isTyping: boolean) => {
    if (!socketInstance) return;
    const { onlineRoomId, onlinePlayerId } = useGameStore.getState();
    if (!onlineRoomId) return;
    socketInstance.emit("typingState", { roomId: onlineRoomId, playerId: onlinePlayerId, isTyping });
  }, []);

  // Set move intercept callback in store
  useEffect(() => {
    setOnOnlineMove(sendMove);
    return () => {
      setOnOnlineMove(null);
    };
  }, [sendMove, setOnOnlineMove]);

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
    isConnected: socketInstance?.connected || false,
    socket: socketInstance,
  };
}
