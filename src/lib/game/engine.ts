// ============================================================
// Game Engine — Core Board Logic
// Ported from legacy app.js with full TypeScript safety
// ============================================================

import type { CellValue, Player, WinResult, BoardSize } from "./types";

/**
 * Compute the "K" (how many in a row needed) for a given board size.
 * 3×3 → 3, 4×4 → 4, 5×5 → 4
 */
export function winLengthForSize(size: BoardSize): number {
  return size === 3 ? 3 : 4;
}

/**
 * Generate all possible winning patterns for a board of given size.
 * Returns arrays of cell indices that form a line.
 */
export function generateWinPatterns(size: number, k: number): number[][] {
  const patterns: number[][] = [];
  const idx = (r: number, c: number) => r * size + c;

  // Rows
  for (let r = 0; r < size; r++) {
    for (let c = 0; c <= size - k; c++) {
      const line: number[] = [];
      for (let i = 0; i < k; i++) line.push(idx(r, c + i));
      patterns.push(line);
    }
  }

  // Columns
  for (let c = 0; c < size; c++) {
    for (let r = 0; r <= size - k; r++) {
      const line: number[] = [];
      for (let i = 0; i < k; i++) line.push(idx(r + i, c));
      patterns.push(line);
    }
  }

  // Diagonal ↘
  for (let r = 0; r <= size - k; r++) {
    for (let c = 0; c <= size - k; c++) {
      const line: number[] = [];
      for (let i = 0; i < k; i++) line.push(idx(r + i, c + i));
      patterns.push(line);
    }
  }

  // Diagonal ↗
  for (let r = k - 1; r < size; r++) {
    for (let c = 0; c <= size - k; c++) {
      const line: number[] = [];
      for (let i = 0; i < k; i++) line.push(idx(r - i, c + i));
      patterns.push(line);
    }
  }

  return patterns;
}

/**
 * Check the board for a winner. Returns the winner and winning pattern,
 * or null if no winner yet.
 */
export function checkWinner(
  board: CellValue[],
  patterns: number[][]
): WinResult | null {
  for (const pattern of patterns) {
    const values = pattern.map((i) => board[i]);
    if (values.every((v) => v !== null) && values.every((v) => v === values[0])) {
      return { winner: values[0] as Player, pattern };
    }
  }
  return null;
}

/**
 * Check if the board is full (draw).
 */
export function isDraw(board: CellValue[]): boolean {
  return board.every((cell) => cell !== null);
}

/**
 * Get indices of empty cells.
 */
export function getEmptyCells(board: CellValue[]): number[] {
  return board.reduce<number[]>((acc, cell, i) => {
    if (cell === null) acc.push(i);
    return acc;
  }, []);
}

/**
 * Create a fresh empty board.
 */
export function createEmptyBoard(size: BoardSize): CellValue[] {
  return Array(size * size).fill(null);
}

/**
 * Apply a move to the board immutably.
 */
export function applyMove(
  board: CellValue[],
  index: number,
  player: Player
): CellValue[] {
  if (board[index] !== null) return board;
  const newBoard = [...board];
  newBoard[index] = player;
  return newBoard;
}

/**
 * Get the other player.
 */
export function opponent(player: Player): Player {
  return player === "X" ? "O" : "X";
}

/**
 * Calculate the center cell index(es) for a board.
 */
export function getCenterCells(size: number): number[] {
  if (size % 2 === 1) {
    return [Math.floor((size * size) / 2)];
  }
  const mid = size / 2;
  return [
    (mid - 1) * size + (mid - 1),
    (mid - 1) * size + mid,
    mid * size + (mid - 1),
    mid * size + mid,
  ];
}

/**
 * Get corner cells for a board.
 */
export function getCornerCells(size: number): number[] {
  return [0, size - 1, size * (size - 1), size * size - 1];
}

/**
 * Compute SVG coordinates for the win line overlay.
 * The SVG viewBox is 300×300.
 */
export function getWinLineCoords(
  pattern: number[],
  size: number
): { x1: number; y1: number; x2: number; y2: number } {
  const step = 300 / size;
  const first = pattern[0];
  const last = pattern[pattern.length - 1];

  const r1 = Math.floor(first / size);
  const c1 = first % size;
  const r2 = Math.floor(last / size);
  const c2 = last % size;

  return {
    x1: c1 * step + step / 2,
    y1: r1 * step + step / 2,
    x2: c2 * step + step / 2,
    y2: r2 * step + step / 2,
  };
}

/**
 * Convert series mode (best of N) to wins needed.
 */
export function seriesToWins(bestOf: number): number {
  return bestOf === 1 ? 1 : bestOf === 3 ? 2 : 3;
}
