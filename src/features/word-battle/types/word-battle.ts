// ============================================================
// Word Battle Game Type Definitions
// Core types for Solo, Hangman, and Multiplayer word games
// ============================================================

export type WordDifficulty = "easy" | "medium" | "hard";

export type WordGameStatus = "idle" | "playing" | "victory" | "defeat" | "draw";

export type LetterState = "empty" | "tbd" | "correct" | "present" | "absent";

export interface LetterInfo {
  char: string;
  state: LetterState;
}

export type KeyboardState = Record<string, "correct" | "present" | "absent" | "unused">;

// --- Solo (Wordle-style) Mode Types ---
export interface SoloStats {
  played: number;
  won: number;
  currentStreak: number;
  maxStreak: number;
  distribution: Record<number, number>; // attempts (1 to 6) -> count
}

export interface SoloGameState {
  difficulty: WordDifficulty;
  status: WordGameStatus;
  secretWord: string;
  guesses: string[]; // List of fully submitted words (e.g. ["REACT", "WORLD"])
  currentGuess: string; // The current in-progress word input
  maxAttempts: number;
  attemptsUsed: number;
  stats: Record<WordDifficulty, SoloStats>;
}

// --- Hangman Mode Types ---
export interface HangmanStats {
  played: number;
  won: number;
  lost: number;
}

export interface HangmanGameState {
  difficulty: WordDifficulty;
  status: WordGameStatus;
  secretWord: string;
  category: string;
  lives: number; // starts at 6, counts down to 0
  guessedLetters: string[]; // list of guessed letters
  stats: Record<WordDifficulty, HangmanStats>;
}

// --- Multiplayer Mode Types ---
export interface MultiplayerPlayer {
  playerId: string;
  socketId: string;
  name: string;
  isHost: boolean;
  isConnected: boolean;
  isReady?: boolean;
}

export interface MultiplayerRoomState {
  roomId: string;
  status: "waiting" | "playing" | "finished";
  players: MultiplayerPlayer[];
  secretWord: string;
  difficulty: WordDifficulty;
  winnerId: string | null;
  draw: boolean;
  // Game scores (how many rounds won in this session)
  scores: Record<string, number>;
  rematchRequests: string[];
  
  // Real-time synchronization state
  // Records the progress of each player (array of guessed words or letter infos)
  playerProgress: Record<string, {
    guesses: string[];
    attemptsUsed: number;
    solved: boolean;
    failed: boolean;
  }>;
}
