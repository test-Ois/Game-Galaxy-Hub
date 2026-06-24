import { useCallback, useMemo } from "react";
import { useWordBattleStore } from "../store/wordBattleStore";
import { KeyboardState } from "../types/word-battle";

export function useWordBattle() {
  const soloDifficulty = useWordBattleStore((s) => s.soloDifficulty);
  const soloStatus = useWordBattleStore((s) => s.soloStatus);
  const soloSecretWord = useWordBattleStore((s) => s.soloSecretWord);
  const soloGuesses = useWordBattleStore((s) => s.soloGuesses);
  const soloCurrentGuess = useWordBattleStore((s) => s.soloCurrentGuess);
  const soloStats = useWordBattleStore((s) => s.soloStats);

  const startSoloGame = useWordBattleStore((s) => s.startSoloGame);
  const addSoloLetter = useWordBattleStore((s) => s.addSoloLetter);
  const removeSoloLetter = useWordBattleStore((s) => s.removeSoloLetter);
  const submitSoloGuess = useWordBattleStore((s) => s.submitSoloGuess);
  const resetSoloStats = useWordBattleStore((s) => s.resetSoloStats);

  // Compute keyboard letter statuses based on guesses submitted so far
  const keyboardStatuses = useMemo(() => {
    const statuses: KeyboardState = {};
    
    // Initialize keyboard characters
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    letters.forEach((l) => {
      statuses[l] = "unused";
    });

    soloGuesses.forEach((guess) => {
      for (let i = 0; i < guess.length; i++) {
        const char = guess[i];
        const secretChar = soloSecretWord[i];

        if (char === secretChar) {
          statuses[char] = "correct";
        } else if (soloSecretWord.includes(char)) {
          // Only upgrade to "present" if not already "correct"
          if (statuses[char] !== "correct") {
            statuses[char] = "present";
          }
        } else {
          // Absent letter
          if (statuses[char] !== "correct" && statuses[char] !== "present") {
            statuses[char] = "absent";
          }
        }
      }
    });

    return statuses;
  }, [soloGuesses, soloSecretWord]);

  const onChar = useCallback(
    (value: string) => {
      addSoloLetter(value);
    },
    [addSoloLetter]
  );

  const onDelete = useCallback(() => {
    removeSoloLetter();
  }, [removeSoloLetter]);

  const onEnter = useCallback(() => {
    submitSoloGuess();
  }, [submitSoloGuess]);

  return {
    difficulty: soloDifficulty,
    status: soloStatus,
    secretWord: soloSecretWord,
    guesses: soloGuesses,
    currentGuess: soloCurrentGuess,
    stats: soloStats[soloDifficulty],
    keyboardStatuses,
    startSoloGame,
    onChar,
    onDelete,
    onEnter,
    resetSoloStats,
  };
}
