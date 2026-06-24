// ============================================================
// useWordBattleSocket — Socket.IO Real-Time Multiplayer Hook
// Handles all word:* events for Word Battle multiplayer mode
// ============================================================

"use client";

import { useEffect, useCallback, useRef } from "react";
import { getSocket } from "@/shared/services/socket/socketClient";
import { generateId } from "@/shared/services/utils";
import { useWordBattleStore } from "../store/wordBattleStore";
import { MultiplayerRoomState } from "../types/word-battle";

// Module-level callbacks to avoid stale closures across re-renders
let roomCreatedCallback: ((roomId: string) => void) | null = null;
let roomJoinedCallback: ((roomId: string) => void) | null = null;
let errorCallback: ((msg: string) => void) | null = null;

const WORD_EVENTS = {
  CREATE_ROOM: "word:create-room",
  JOIN_ROOM: "word:join-room",
  START_GAME: "word:start-game",
  GUESS: "word:guess",
  PROGRESS: "word:progress",
  WIN: "word:win",
  DRAW: "word:draw",
  PLAY_AGAIN: "word:play-again",
  LEAVE_ROOM: "word:leave-room",
  ROOM_UPDATED: "word:room-updated",
  ERROR: "word:error",
} as const;

export function useWordBattleSocket() {
  const setMultiplayerRoom = useWordBattleStore((s) => s.setMultiplayerRoom);
  const setMultiplayerPlayerDetails = useWordBattleStore((s) => s.setMultiplayerPlayerDetails);
  const multiplayerPlayerId = useWordBattleStore((s) => s.multiplayerPlayerId);
  const multiplayerRoom = useWordBattleStore((s) => s.multiplayerRoom);

  const playerIdRef = useRef<string | null>(null);

  // Initialize a persistent player ID
  useEffect(() => {
    let pid = multiplayerPlayerId;
    if (!pid && typeof window !== "undefined") {
      pid = sessionStorage.getItem("wb-player-id");
      if (!pid) {
        pid = `wb-player-${generateId()}`;
        sessionStorage.setItem("wb-player-id", pid);
      }
      setMultiplayerPlayerDetails(pid, "");
    }
    playerIdRef.current = pid;
  }, [multiplayerPlayerId, setMultiplayerPlayerDetails]);

  // Establish socket listeners (called once on component mount)
  const connect = useCallback(() => {
    const socket = getSocket();

    socket.off(WORD_EVENTS.ROOM_UPDATED);
    socket.off(WORD_EVENTS.ERROR);

    // Room updates (status changes, game start, etc.)
    socket.on(WORD_EVENTS.ROOM_UPDATED, (room: MultiplayerRoomState) => {
      setMultiplayerRoom(room);

      // Fire callbacks
      if (room.status === "waiting" && roomCreatedCallback) {
        const cb = roomCreatedCallback;
        roomCreatedCallback = null;
        cb(room.roomId);
      }
      if (room.status === "waiting" && roomJoinedCallback) {
        const cb = roomJoinedCallback;
        roomJoinedCallback = null;
        cb(room.roomId);
      }
    });

    socket.on(WORD_EVENTS.ERROR, (msg: string) => {
      if (errorCallback) {
        const cb = errorCallback;
        errorCallback = null;
        cb(msg);
      }
    });

    if (!socket.connected) {
      socket.connect();
    }

    return socket;
  }, [setMultiplayerRoom]);

  // Create a Word Battle room
  const createRoom = useCallback(
    (
      name: string,
      onCreated: (roomId: string) => void,
      onError?: (msg: string) => void
    ) => {
      const socket = connect();
      const pid = playerIdRef.current || `wb-player-${generateId()}`;
      playerIdRef.current = pid;

      roomCreatedCallback = onCreated;
      if (onError) errorCallback = onError;

      socket.emit(WORD_EVENTS.CREATE_ROOM, { name, playerId: pid });
    },
    [connect]
  );

  // Join an existing Word Battle room by code
  const joinRoom = useCallback(
    (
      name: string,
      roomId: string,
      onJoined: (roomId: string) => void,
      onError?: (msg: string) => void
    ) => {
      const socket = connect();
      const pid = playerIdRef.current || `wb-player-${generateId()}`;
      playerIdRef.current = pid;

      roomJoinedCallback = onJoined;
      if (onError) errorCallback = onError;

      socket.emit(WORD_EVENTS.JOIN_ROOM, { name, roomId, playerId: pid });
    },
    [connect]
  );

  // Start game (host only)
  const startGame = useCallback(() => {
    const socket = getSocket();
    const pid = playerIdRef.current;
    if (!multiplayerRoom || !pid) return;
    socket.emit(WORD_EVENTS.START_GAME, {
      roomId: multiplayerRoom.roomId,
      playerId: pid,
    });
  }, [multiplayerRoom]);

  // Submit a word guess
  const submitGuess = useCallback(
    (guess: string) => {
      const socket = getSocket();
      const pid = playerIdRef.current;
      if (!multiplayerRoom || !pid) return;
      socket.emit(WORD_EVENTS.GUESS, {
        roomId: multiplayerRoom.roomId,
        playerId: pid,
        guess: guess.toUpperCase(),
      });
    },
    [multiplayerRoom]
  );

  // Send real-time typing progress (for the opponent's progress bar)
  const sendProgress = useCallback(
    (attemptsUsed: number) => {
      const socket = getSocket();
      const pid = playerIdRef.current;
      if (!multiplayerRoom || !pid) return;
      socket.emit(WORD_EVENTS.PROGRESS, {
        roomId: multiplayerRoom.roomId,
        playerId: pid,
        attemptsUsed,
      });
    },
    [multiplayerRoom]
  );

  // Request a rematch / play again
  const requestPlayAgain = useCallback(() => {
    const socket = getSocket();
    const pid = playerIdRef.current;
    if (!multiplayerRoom || !pid) return;
    socket.emit(WORD_EVENTS.PLAY_AGAIN, {
      roomId: multiplayerRoom.roomId,
      playerId: pid,
    });
  }, [multiplayerRoom]);

  // Leave / disconnect from a room
  const leaveRoom = useCallback(() => {
    const socket = getSocket();
    const pid = playerIdRef.current;
    if (!multiplayerRoom || !pid) return;
    socket.emit(WORD_EVENTS.LEAVE_ROOM, {
      roomId: multiplayerRoom.roomId,
      playerId: pid,
    });
    setMultiplayerRoom(null);
  }, [multiplayerRoom, setMultiplayerRoom]);

  // Rejoin an existing room after page refresh
  const rejoinRoom = useCallback(
    (roomId: string) => {
      const socket = connect();
      const pid = playerIdRef.current;
      if (!pid) return;
      socket.emit("word:rejoin-room", { roomId, playerId: pid });
    },
    [connect]
  );

  const socket = getSocket();

  return {
    connect,
    createRoom,
    joinRoom,
    startGame,
    submitGuess,
    sendProgress,
    requestPlayAgain,
    leaveRoom,
    rejoinRoom,
    isConnected: socket.connected,
    socket,
    playerId: playerIdRef.current,
  };
}
