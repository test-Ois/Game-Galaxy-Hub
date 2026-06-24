"use client";

import { GameTile } from "./GameTile";
import { LetterInfo, LetterState } from "../../types/word-battle";

const MAX_ATTEMPTS = 6;

interface GameBoardProps {
  secretWord: string;
  guesses: string[];
  currentGuess: string;
  shakeRow: number | null;
  revealedRows: Set<number>;
}

/**
 * Compute letter-level result for a submitted guess against the secret word.
 * Uses Wordle's double-elimination algorithm (handles duplicate letters correctly).
 */
function evaluateGuess(guess: string, secret: string): LetterInfo[] {
  const result: LetterInfo[] = guess.split("").map((char) => ({
    char,
    state: "absent" as LetterState,
  }));

  const secretArr = secret.split("");
  const remaining: (string | null)[] = [...secretArr];

  // First pass: mark correct positions
  guess.split("").forEach((char, i) => {
    if (char === secretArr[i]) {
      result[i].state = "correct";
      remaining[i] = null;
    }
  });

  // Second pass: mark present (wrong position)
  guess.split("").forEach((char, i) => {
    if (result[i].state === "correct") return;
    const idx = remaining.findIndex((r) => r === char);
    if (idx !== -1) {
      result[i].state = "present";
      remaining[idx] = null;
    }
  });

  return result;
}

export function GameBoard({
  secretWord,
  guesses,
  currentGuess,
  shakeRow,
  revealedRows,
}: GameBoardProps) {
  const wordLength = secretWord.length || 5;

  const rows = Array.from({ length: MAX_ATTEMPTS }, (_, rowIdx) => {
    const isSubmitted = rowIdx < guesses.length;
    const isCurrent = rowIdx === guesses.length;
    const isShaking = shakeRow === rowIdx;

    let tiles: LetterInfo[];

    if (isSubmitted) {
      tiles = evaluateGuess(guesses[rowIdx], secretWord);
    } else if (isCurrent) {
      tiles = Array.from({ length: wordLength }, (_, i) => ({
        char: currentGuess[i] || "",
        state: currentGuess[i] ? ("tbd" as LetterState) : ("empty" as LetterState),
      }));
    } else {
      tiles = Array.from({ length: wordLength }, () => ({
        char: "",
        state: "empty" as LetterState,
      }));
    }

    return { tiles, isSubmitted, isShaking, rowIdx };
  });

  return (
    <div className="flex flex-col gap-1.5 sm:gap-2 w-full">
      {rows.map(({ tiles, isSubmitted, isShaking, rowIdx }) => (
        <div
          key={rowIdx}
          className="grid gap-1.5 sm:gap-2"
          style={{ gridTemplateColumns: `repeat(${wordLength}, 1fr)` }}
        >
          {tiles.map((tile, colIdx) => (
            <GameTile
              key={colIdx}
              position={colIdx}
              char={tile.char}
              state={tile.state}
              animate={isSubmitted && revealedRows.has(rowIdx)}
              delay={colIdx * 0.1}
              shake={isShaking}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
