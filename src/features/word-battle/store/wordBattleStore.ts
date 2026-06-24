import { create } from "zustand";
import { persist } from "zustand/middleware";
import { 
  WordDifficulty, 
  WordGameStatus, 
  SoloStats, 
  HangmanStats, 
  MultiplayerRoomState 
} from "../types/word-battle";
import { EASY_WORDS } from "../lib/words/easy";
import { MEDIUM_WORDS } from "../lib/words/medium";
import { HARD_WORDS } from "../lib/words/hard";

const getRandomWordItem = (difficulty: WordDifficulty) => {
  const list = difficulty === "easy" ? EASY_WORDS : difficulty === "medium" ? MEDIUM_WORDS : HARD_WORDS;
  const randomIndex = Math.floor(Math.random() * list.length);
  return list[randomIndex];
};

const initialSoloStats = (): SoloStats => ({
  played: 0,
  won: 0,
  currentStreak: 0,
  maxStreak: 0,
  distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
});

const initialHangmanStats = (): HangmanStats => ({
  played: 0,
  won: 0,
  lost: 0,
});

interface WordBattleStore {
  // --- Solo State ---
  soloDifficulty: WordDifficulty;
  soloStatus: WordGameStatus;
  soloSecretWord: string;
  soloGuesses: string[];
  soloCurrentGuess: string;
  soloStats: Record<WordDifficulty, SoloStats>;

  // Solo Actions
  startSoloGame: (difficulty?: WordDifficulty) => void;
  addSoloLetter: (char: string) => void;
  removeSoloLetter: () => void;
  submitSoloGuess: () => void;
  resetSoloStats: () => void;

  // --- Hangman State ---
  hangmanDifficulty: WordDifficulty;
  hangmanStatus: WordGameStatus;
  hangmanSecretWord: string;
  hangmanCategory: string;
  hangmanLives: number;
  hangmanGuessedLetters: string[];
  hangmanStats: Record<WordDifficulty, HangmanStats>;

  // Hangman Actions
  startHangmanGame: (difficulty?: WordDifficulty) => void;
  guessHangmanLetter: (char: string) => void;
  resetHangmanStats: () => void;

  // --- Multiplayer State ---
  multiplayerRoom: MultiplayerRoomState | null;
  multiplayerPlayerId: string | null;
  multiplayerPlayerName: string | null;

  // Multiplayer Actions
  setMultiplayerRoom: (room: MultiplayerRoomState | null) => void;
  setMultiplayerPlayerDetails: (id: string, name: string) => void;
}

export const useWordBattleStore = create<WordBattleStore>()(
  persist(
    (set, get) => ({
      // --- Solo Init State ---
      soloDifficulty: "medium",
      soloStatus: "idle",
      soloSecretWord: "",
      soloGuesses: [],
      soloCurrentGuess: "",
      soloStats: {
        easy: initialSoloStats(),
        medium: initialSoloStats(),
        hard: initialSoloStats(),
      },

      startSoloGame: (difficulty) => {
        const diff = difficulty || get().soloDifficulty;
        const wordItem = getRandomWordItem(diff);
        set({
          soloDifficulty: diff,
          soloStatus: "playing",
          soloSecretWord: wordItem.word.toUpperCase(),
          soloGuesses: [],
          soloCurrentGuess: "",
        });
      },

      addSoloLetter: (char) => {
        const { soloStatus, soloSecretWord, soloCurrentGuess } = get();
        if (soloStatus !== "playing") return;
        if (soloCurrentGuess.length >= soloSecretWord.length) return;
        set({ soloCurrentGuess: (soloCurrentGuess + char).toUpperCase() });
      },

      removeSoloLetter: () => {
        const { soloStatus, soloCurrentGuess } = get();
        if (soloStatus !== "playing") return;
        if (soloCurrentGuess.length === 0) return;
        set({ soloCurrentGuess: soloCurrentGuess.slice(0, -1) });
      },

      submitSoloGuess: () => {
        const { 
          soloStatus, 
          soloSecretWord, 
          soloGuesses, 
          soloCurrentGuess, 
          soloDifficulty, 
          soloStats 
        } = get();

        if (soloStatus !== "playing") return;
        if (soloCurrentGuess.length !== soloSecretWord.length) return;

        const newGuesses = [...soloGuesses, soloCurrentGuess];
        const attemptsUsed = newGuesses.length;
        const isWin = soloCurrentGuess === soloSecretWord;
        const isLoss = !isWin && attemptsUsed >= 6;

        let nextStatus: WordGameStatus = "playing";
        let updatedStats = { ...soloStats };

        if (isWin || isLoss) {
          nextStatus = isWin ? "victory" : "defeat";
          const diffStats = { ...updatedStats[soloDifficulty] };
          
          diffStats.played += 1;
          if (isWin) {
            diffStats.won += 1;
            diffStats.currentStreak += 1;
            if (diffStats.currentStreak > diffStats.maxStreak) {
              diffStats.maxStreak = diffStats.currentStreak;
            }
            diffStats.distribution[attemptsUsed] = (diffStats.distribution[attemptsUsed] || 0) + 1;
          } else {
            diffStats.currentStreak = 0;
          }
          updatedStats[soloDifficulty] = diffStats;
        }

        set({
          soloGuesses: newGuesses,
          soloCurrentGuess: "",
          soloStatus: nextStatus,
          soloStats: updatedStats,
        });
      },

      resetSoloStats: () => {
        set({
          soloStats: {
            easy: initialSoloStats(),
            medium: initialSoloStats(),
            hard: initialSoloStats(),
          },
        });
      },

      // --- Hangman Init State ---
      hangmanDifficulty: "medium",
      hangmanStatus: "idle",
      hangmanSecretWord: "",
      hangmanCategory: "",
      hangmanLives: 6,
      hangmanGuessedLetters: [],
      hangmanStats: {
        easy: initialHangmanStats(),
        medium: initialHangmanStats(),
        hard: initialHangmanStats(),
      },

      startHangmanGame: (difficulty) => {
        const diff = difficulty || get().hangmanDifficulty;
        const wordItem = getRandomWordItem(diff);
        set({
          hangmanDifficulty: diff,
          hangmanStatus: "playing",
          hangmanSecretWord: wordItem.word.toUpperCase(),
          hangmanCategory: wordItem.category,
          hangmanLives: 6,
          hangmanGuessedLetters: [],
        });
      },

      guessHangmanLetter: (char) => {
        const { 
          hangmanStatus, 
          hangmanSecretWord, 
          hangmanGuessedLetters, 
          hangmanLives, 
          hangmanDifficulty, 
          hangmanStats 
        } = get();

        const formattedChar = char.toUpperCase();
        if (hangmanStatus !== "playing") return;
        if (hangmanGuessedLetters.includes(formattedChar)) return;

        const isCorrect = hangmanSecretWord.includes(formattedChar);
        const newGuessed = [...hangmanGuessedLetters, formattedChar];
        const newLives = isCorrect ? hangmanLives : Math.max(0, hangmanLives - 1);

        // Check Win: all letters of secretWord are in newGuessed
        const isWin = hangmanSecretWord.split("").every((letter) => newGuessed.includes(letter));
        const isLoss = !isWin && newLives <= 0;

        let nextStatus: WordGameStatus = "playing";
        let updatedStats = { ...hangmanStats };

        if (isWin || isLoss) {
          nextStatus = isWin ? "victory" : "defeat";
          const diffStats = { ...updatedStats[hangmanDifficulty] };
          
          diffStats.played += 1;
          if (isWin) {
            diffStats.won += 1;
          } else {
            diffStats.lost += 1;
          }
          updatedStats[hangmanDifficulty] = diffStats;
        }

        set({
          hangmanGuessedLetters: newGuessed,
          hangmanLives: newLives,
          hangmanStatus: nextStatus,
          hangmanStats: updatedStats,
        });
      },

      resetHangmanStats: () => {
        set({
          hangmanStats: {
            easy: initialHangmanStats(),
            medium: initialHangmanStats(),
            hard: initialHangmanStats(),
          },
        });
      },

      // --- Multiplayer Init State ---
      multiplayerRoom: null,
      multiplayerPlayerId: null,
      multiplayerPlayerName: null,

      setMultiplayerRoom: (room) => set({ multiplayerRoom: room }),
      setMultiplayerPlayerDetails: (id, name) => set({ multiplayerPlayerId: id, multiplayerPlayerName: name }),
    }),
    {
      name: "wordbattle-game-store",
      partialize: (state) => ({
        soloStats: state.soloStats,
        hangmanStats: state.hangmanStats,
        soloDifficulty: state.soloDifficulty,
        hangmanDifficulty: state.hangmanDifficulty,
      }),
    }
  )
);
