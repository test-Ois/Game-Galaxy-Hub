// ============================================================
// Game Store — Zustand State Management
// Central game state with history, scoring, and series tracking
// ============================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  CellValue,
  Player,
  GameMode,
  Difficulty,
  BoardSize,
  SeriesMode,
  Move,
  WinResult,
  MatchRecord,
} from "@/lib/game/types";
import {
  createEmptyBoard,
  generateWinPatterns,
  checkWinner,
  isDraw,
  applyMove,
  winLengthForSize,
  seriesToWins,
  opponent,
} from "@/lib/game/engine";
import { getAIMove } from "@/lib/game/ai";
import { GAME_CONFIG } from "@/lib/game/constants";
import { generateId } from "@/lib/utils";

// ─── State Interface ───────────────────────────────────────

interface GameStore {
  // Board state
  board: CellValue[];
  boardSize: BoardSize;
  winLength: number;
  winPatterns: number[][];
  currentPlayer: Player;
  isGameOver: boolean;
  winResult: WinResult | null;
  moveCount: number;

  // History
  history: Move[];
  redoStack: Move[];

  // Scoring
  scores: Record<Player | "D", number>;
  seriesWins: Record<Player, number>;
  seriesTarget: number;
  isSeriesComplete: boolean;
  seriesWinner: Player | null;

  // Mode
  mode: GameMode;
  difficulty: Difficulty;
  seriesMode: SeriesMode;

  // AI state
  isAIThinking: boolean;

  // Timer
  gameStartTime: number | null;
  gameDuration: number;

  // Match history
  matchHistory: MatchRecord[];

  // Actions
  makeMove: (index: number) => void;
  triggerAIMove: () => void;
  undo: () => void;
  redo: () => void;
  resetRound: () => void;
  resetAll: () => void;
  setBoardSize: (size: BoardSize) => void;
  setMode: (mode: GameMode) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  setSeriesMode: (series: SeriesMode) => void;
}

// ─── Store ─────────────────────────────────────────────────

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // Initial state
      board: createEmptyBoard(3),
      boardSize: 3,
      winLength: 3,
      winPatterns: generateWinPatterns(3, 3),
      currentPlayer: "O" as Player,
      isGameOver: false,
      winResult: null,
      moveCount: 0,

      history: [],
      redoStack: [],

      scores: { X: 0, O: 0, D: 0 },
      seriesWins: { X: 0, O: 0 },
      seriesTarget: 2,
      isSeriesComplete: false,
      seriesWinner: null,

      mode: "pvai",
      difficulty: "medium",
      seriesMode: 3,

      isAIThinking: false,

      gameStartTime: Date.now(),
      gameDuration: 0,

      matchHistory: [],

      // ─── Actions ───────────────────────────────────────

      makeMove: (index: number) => {
        const state = get();
        if (state.isGameOver || state.board[index] !== null) return;

        const player = state.currentPlayer;
        const newBoard = applyMove(state.board, index, player);
        const move: Move = { index, player, timestamp: Date.now() };
        const newHistory = [...state.history, move];
        const newMoveCount = state.moveCount + 1;

        // Check for winner
        const win = checkWinner(newBoard, state.winPatterns);
        const draw = !win && isDraw(newBoard);

        if (win) {
          const newScores = { ...state.scores, [win.winner]: state.scores[win.winner] + 1 };
          const newSeriesWins = {
            ...state.seriesWins,
            [win.winner]: state.seriesWins[win.winner] + 1,
          };

          const seriesComplete = newSeriesWins[win.winner] >= state.seriesTarget;
          const duration = state.gameStartTime
            ? Math.floor((Date.now() - state.gameStartTime) / 1000)
            : 0;

          // Record match
          const record: MatchRecord = {
            id: generateId(),
            mode: state.mode,
            difficulty: state.mode === "pvai" ? state.difficulty : undefined,
            boardSize: state.boardSize,
            winner: win.winner,
            moves: newHistory,
            duration,
            date: new Date().toISOString(),
            playerX: state.mode === "pvai" ? "Q-AI" : "Player X",
            playerO: "Player O",
          };

          set({
            board: newBoard,
            history: newHistory,
            redoStack: [],
            moveCount: newMoveCount,
            isGameOver: true,
            winResult: win,
            currentPlayer: opponent(player),
            scores: newScores,
            seriesWins: newSeriesWins,
            isSeriesComplete: seriesComplete,
            seriesWinner: seriesComplete ? win.winner : null,
            gameDuration: duration,
            matchHistory: [record, ...state.matchHistory].slice(0, 50), // keep last 50
          });
        } else if (draw) {
          const duration = state.gameStartTime
            ? Math.floor((Date.now() - state.gameStartTime) / 1000)
            : 0;

          const record: MatchRecord = {
            id: generateId(),
            mode: state.mode,
            difficulty: state.mode === "pvai" ? state.difficulty : undefined,
            boardSize: state.boardSize,
            winner: "draw",
            moves: newHistory,
            duration,
            date: new Date().toISOString(),
            playerX: state.mode === "pvai" ? "Q-AI" : "Player X",
            playerO: "Player O",
          };

          set({
            board: newBoard,
            history: newHistory,
            redoStack: [],
            moveCount: newMoveCount,
            isGameOver: true,
            winResult: null,
            currentPlayer: opponent(player),
            scores: { ...state.scores, D: state.scores.D + 1 },
            gameDuration: duration,
            matchHistory: [record, ...state.matchHistory].slice(0, 50),
          });
        } else {
          set({
            board: newBoard,
            history: newHistory,
            redoStack: [],
            moveCount: newMoveCount,
            currentPlayer: opponent(player),
          });
        }
      },

      triggerAIMove: () => {
        const state = get();
        if (state.isGameOver || state.mode !== "pvai") return;
        if (state.currentPlayer === "O") return; // Human is O

        set({ isAIThinking: true });

        setTimeout(() => {
          const s = get();
          if (s.isGameOver) {
            set({ isAIThinking: false });
            return;
          }

          const aiIndex = getAIMove(
            s.board,
            s.difficulty,
            s.boardSize,
            "X"
          );

          set({ isAIThinking: false });
          if (aiIndex !== undefined && aiIndex !== -1) {
            get().makeMove(aiIndex);
          }
        }, GAME_CONFIG.AI_MOVE_DELAY);
      },

      undo: () => {
        const state = get();
        if (state.history.length === 0) return;

        // In AI mode, undo both moves (AI + human)
        if (state.mode === "pvai" && state.history.length >= 2) {
          const last = state.history[state.history.length - 1];
          const secondLast = state.history[state.history.length - 2];

          if (last.player === "X" && secondLast.player === "O") {
            const newBoard = [...state.board];
            newBoard[last.index] = null;
            newBoard[secondLast.index] = null;

            set({
              board: newBoard,
              history: state.history.slice(0, -2),
              redoStack: [secondLast, last, ...state.redoStack],
              moveCount: Math.max(0, state.moveCount - 2),
              currentPlayer: "O",
              isGameOver: false,
              winResult: null,
            });
            return;
          }
        }

        const lastMove = state.history[state.history.length - 1];
        const newBoard = [...state.board];
        newBoard[lastMove.index] = null;

        set({
          board: newBoard,
          history: state.history.slice(0, -1),
          redoStack: [lastMove, ...state.redoStack],
          moveCount: Math.max(0, state.moveCount - 1),
          currentPlayer: lastMove.player,
          isGameOver: false,
          winResult: null,
        });
      },

      redo: () => {
        const state = get();
        if (state.redoStack.length === 0) return;

        const move = state.redoStack[0];
        get().makeMove(move.index);
      },

      resetRound: () => {
        const state = get();
        const startPlayer: Player = Math.random() < 0.5 ? "O" : "X";

        set({
          board: createEmptyBoard(state.boardSize),
          currentPlayer: startPlayer,
          isGameOver: false,
          winResult: null,
          moveCount: 0,
          history: [],
          redoStack: [],
          isAIThinking: false,
          gameStartTime: Date.now(),
          gameDuration: 0,
          isSeriesComplete: false,
          seriesWinner: null,
        });

        // If AI starts, trigger its move
        if (state.mode === "pvai" && startPlayer === "X") {
          setTimeout(() => get().triggerAIMove(), 300);
        }
      },

      resetAll: () => {
        const state = get();
        set({
          board: createEmptyBoard(state.boardSize),
          currentPlayer: "O",
          isGameOver: false,
          winResult: null,
          moveCount: 0,
          history: [],
          redoStack: [],
          scores: { X: 0, O: 0, D: 0 },
          seriesWins: { X: 0, O: 0 },
          isSeriesComplete: false,
          seriesWinner: null,
          isAIThinking: false,
          gameStartTime: Date.now(),
          gameDuration: 0,
        });
      },

      setBoardSize: (size: BoardSize) => {
        const k = winLengthForSize(size);
        set({
          boardSize: size,
          winLength: k,
          winPatterns: generateWinPatterns(size, k),
        });
        get().resetAll();
      },

      setMode: (mode: GameMode) => {
        set({ mode });
        get().resetAll();
      },

      setDifficulty: (difficulty: Difficulty) => {
        set({ difficulty });
        get().resetRound();
      },

      setSeriesMode: (series: SeriesMode) => {
        set({
          seriesMode: series,
          seriesTarget: seriesToWins(series),
          seriesWins: { X: 0, O: 0 },
          isSeriesComplete: false,
          seriesWinner: null,
        });
        get().resetRound();
      },
    }),
    {
      name: "ttt-game-store",
      partialize: (state) => ({
        scores: state.scores,
        matchHistory: state.matchHistory,
        mode: state.mode,
        difficulty: state.difficulty,
        boardSize: state.boardSize,
        seriesMode: state.seriesMode,
      }),
    }
  )
);
