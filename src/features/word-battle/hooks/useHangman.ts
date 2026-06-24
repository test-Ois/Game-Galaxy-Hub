import { useCallback } from "react";
import { useWordBattleStore } from "../store/wordBattleStore";
import { WordDifficulty } from "../types/word-battle";

export function useHangman() {
  const difficulty = useWordBattleStore((s) => s.hangmanDifficulty);
  const status = useWordBattleStore((s) => s.hangmanStatus);
  const secretWord = useWordBattleStore((s) => s.hangmanSecretWord);
  const category = useWordBattleStore((s) => s.hangmanCategory);
  const lives = useWordBattleStore((s) => s.hangmanLives);
  const guessedLetters = useWordBattleStore((s) => s.hangmanGuessedLetters);
  const stats = useWordBattleStore((s) => s.hangmanStats);

  const startHangmanGame = useWordBattleStore((s) => s.startHangmanGame);
  const guessHangmanLetter = useWordBattleStore((s) => s.guessHangmanLetter);
  const resetHangmanStats = useWordBattleStore((s) => s.resetHangmanStats);

  const startGame = useCallback(
    (diff?: WordDifficulty) => {
      startHangmanGame(diff);
    },
    [startHangmanGame]
  );

  const guessLetter = useCallback(
    (char: string) => {
      guessHangmanLetter(char.toUpperCase());
    },
    [guessHangmanLetter]
  );

  // Derive revealed word display (e.g. "_ O _ L _")
  const revealedWord = secretWord
    .split("")
    .map((char) => (guessedLetters.includes(char) ? char : "_"))
    .join(" ");

  const wrongGuesses = guessedLetters.filter(
    (letter) => !secretWord.includes(letter)
  );

  const maxLives = 6;
  const livesLost = maxLives - lives;

  return {
    difficulty,
    status,
    secretWord,
    category,
    lives,
    maxLives,
    livesLost,
    guessedLetters,
    wrongGuesses,
    revealedWord,
    stats: stats[difficulty],
    startGame,
    guessLetter,
    resetHangmanStats,
  };
}
