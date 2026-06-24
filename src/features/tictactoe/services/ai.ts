// ============================================================
// AI Module — Minimax + Difficulty Levels
// Ported from legacy app.js with alpha-beta pruning
// ============================================================

import type { CellValue, Player, BoardSize } from "@/shared/types/game";
import { generateWinPatterns, getEmptyCells, getCenterCells, getCornerCells, winLengthForSize } from "./engine";

// ─── Evaluation Helpers ────────────────────────────────────

function evaluateBoard(
  board: CellValue[],
  patterns: number[][]
): Player | "D" | null {
  for (const p of patterns) {
    const vals = p.map((i) => board[i]);
    if (vals.every((v) => v !== null) && vals.every((v) => v === vals[0])) {
      return vals[0] as Player;
    }
  }
  return getEmptyCells(board).length === 0 ? "D" : null;
}

function scoreMinimax(
  result: Player | "D",
  ai: Player,
  human: Player
): number {
  if (result === ai) return 10;
  if (result === human) return -10;
  return 0;
}

// ─── Minimax with Alpha-Beta Pruning ───────────────────────

interface MinimaxResult {
  index: number;
  score: number;
}

function minimaxAB(
  board: CellValue[],
  patterns: number[][],
  isMaximizing: boolean,
  alpha: number,
  beta: number,
  ai: Player,
  human: Player,
  depth: number,
  depthLimit: number
): MinimaxResult {
  const result = evaluateBoard(board, patterns);

  if (result !== null) {
    return { index: -1, score: scoreMinimax(result, ai, human) - depth };
  }

  if (depth >= depthLimit) {
    return { index: -1, score: 0 };
  }

  const available = getEmptyCells(board);
  let bestIndex = available[0];

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (const idx of available) {
      board[idx] = ai;
      const { score } = minimaxAB(
        board, patterns, false, alpha, beta, ai, human, depth + 1, depthLimit
      );
      board[idx] = null;

      if (score > bestScore) {
        bestScore = score;
        bestIndex = idx;
      }
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break; // prune
    }
    return { index: bestIndex, score: bestScore };
  } else {
    let bestScore = Infinity;
    for (const idx of available) {
      board[idx] = human;
      const { score } = minimaxAB(
        board, patterns, true, alpha, beta, ai, human, depth + 1, depthLimit
      );
      board[idx] = null;

      if (score < bestScore) {
        bestScore = score;
        bestIndex = idx;
      }
      beta = Math.min(beta, score);
      if (beta <= alpha) break; // prune
    }
    return { index: bestIndex, score: bestScore };
  }
}

// ─── Difficulty Strategies ─────────────────────────────────

/**
 * Easy AI — completely random moves.
 */
function bestMoveEasy(board: CellValue[]): number {
  const available = getEmptyCells(board);
  return available[Math.floor(Math.random() * available.length)];
}

/**
 * Medium AI — heuristic: win if possible, block opponent,
 * then prefer center → corners → random.
 */
function bestMoveMedium(
  board: CellValue[],
  patterns: number[][],
  size: number,
  k: number,
  ai: Player,
  human: Player
): number {
  // Try to win
  for (const p of patterns) {
    const vals = p.map((i) => board[i]);
    const aiCount = vals.filter((v) => v === ai).length;
    const emptyIdx = p.find((i) => board[i] === null);
    if (aiCount === k - 1 && emptyIdx !== undefined) return emptyIdx;
  }

  // Block opponent win
  for (const p of patterns) {
    const vals = p.map((i) => board[i]);
    const humanCount = vals.filter((v) => v === human).length;
    const emptyIdx = p.find((i) => board[i] === null);
    if (humanCount === k - 1 && emptyIdx !== undefined) return emptyIdx;
  }

  // Center
  const centers = getCenterCells(size);
  for (const c of centers) {
    if (board[c] === null) return c;
  }

  // Corners
  const corners = getCornerCells(size);
  for (const c of corners) {
    if (board[c] === null) return c;
  }

  // Random fallback
  return bestMoveEasy(board);
}

/**
 * Hard AI — minimax with alpha-beta pruning and dynamic depth limits.
 * Depth limits prevent freezing on larger boards.
 */
function bestMoveHard(
  board: CellValue[],
  patterns: number[][],
  size: number,
  k: number,
  ai: Player,
  human: Player
): number {
  // Dynamic depth caps to prevent UI freeze
  const depthLimit = size === 3 ? 9 : size === 4 ? 4 : 3;

  // Work on a mutable copy
  const boardCopy = [...board];
  const result = minimaxAB(
    boardCopy, patterns, true, -Infinity, Infinity,
    ai, human, 0, depthLimit
  );

  // Safety fallback
  if (result.index === -1 || boardCopy[result.index] !== null) {
    return bestMoveMedium(board, patterns, size, k, ai, human);
  }

  return result.index;
}

// ─── Public API ────────────────────────────────────────────

/**
 * Get the AI's move for the current board state.
 * AI always plays as the specified player.
 */
export function getAIMove(
  board: CellValue[],
  difficulty: "easy" | "medium" | "hard",
  boardSize: BoardSize,
  aiPlayer: Player = "X"
): number {
  const humanPlayer: Player = aiPlayer === "X" ? "O" : "X";
  const k = winLengthForSize(boardSize);
  const patterns = generateWinPatterns(boardSize, k);

  switch (difficulty) {
    case "easy":
      return bestMoveEasy(board);
    case "medium":
      return bestMoveMedium(board, patterns, boardSize, k, aiPlayer, humanPlayer);
    case "hard":
      return bestMoveHard(board, patterns, boardSize, k, aiPlayer, humanPlayer);
    default:
      return bestMoveEasy(board);
  }
}
