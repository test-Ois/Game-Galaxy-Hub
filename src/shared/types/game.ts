// ============================================================
// Game Type Definitions
// Core types for the Tic-Tac-Toe game engine
// ============================================================

export type CellValue = "X" | "O" | null;
export type Player = "X" | "O";
export type GameMode = "pvp" | "pvai" | "online";
export type Difficulty = "easy" | "medium" | "hard";
export type BoardSize = 3 | 4 | 5;
export type SeriesMode = 1 | 3 | 5;

export type LudoColor = "red" | "green" | "yellow" | "blue";

export interface ChatMessage {
  id: string;
  senderId: string; // "system" for system messages
  senderName: string;
  content: string;
  timestamp: number;
  type: "chat" | "system";
  systemType?: "join" | "leave" | "disconnect" | "reconnect" | "game_event";
}

export interface LudoRoomState {
  currentPlayerIndex: number;
  diceRoll: number | null;
  hasRolled: boolean;
  tokens: Record<LudoColor, number[]>; // positions: -1 (base) to 56 (goal)
  rankings: LudoColor[];
  isGameStarted: boolean;
  winner: LudoColor | null;
}

export interface OnlinePlayer {
  playerId: string;
  socketId: string;
  name: string;
  symbol: Player | LudoColor;
  isHost: boolean;
  isConnected: boolean;
  isReady?: boolean;
}

export interface OnlineRoom {
  roomId: string;
  gameType?: "tictactoe" | "ludo";
  maxPlayers?: number;
  status: "waiting" | "playing" | "finished";
  settings: {
    boardSize: BoardSize;
    seriesMode: SeriesMode;
    bestOf: number;
    targetWins: number;
  };
  players: OnlinePlayer[];
  board: CellValue[];
  currentPlayer: Player | LudoColor;
  scores: Record<string, number>;
  seriesWins: Record<string, number>;
  isGameOver: boolean;
  winResult: WinResult | null;
  moveCount: number;
  history: Move[];
  isSeriesComplete: boolean;
  seriesWinner: Player | LudoColor | null;
  rematchRequests: string[]; // playerIds
  currentRound: number;
  maxRounds: number;
  seriesScoreX: number;
  seriesScoreO: number;
  roundOver?: boolean;
  roundWinner?: Player | "draw" | null;
  chatHistory?: ChatMessage[];
  ludoState?: LudoRoomState | null;
}

export interface Move {
  index: number;
  player: Player;
  timestamp: number;
}

export interface WinResult {
  winner: Player;
  pattern: number[];
}

export interface MatchRecord {
  id: string;
  mode: GameMode;
  difficulty?: Difficulty;
  boardSize: BoardSize;
  winner: Player | "draw";
  moves: Move[];
  duration: number; // seconds
  date: string;
  playerX: string;
  playerO: string;
}

// XP & Ranking
export const RANK_THRESHOLDS = [
  { name: "Bronze", minXP: 0, color: "#CD7F32" },
  { name: "Silver", minXP: 100, color: "#C0C0C0" },
  { name: "Gold", minXP: 300, color: "#FFD700" },
  { name: "Platinum", minXP: 600, color: "#00CED1" },
  { name: "Diamond", minXP: 1000, color: "#B9F2FF" },
  { name: "Master", minXP: 2000, color: "#FF6B6B" },
  { name: "Grandmaster", minXP: 5000, color: "#A855F7" },
] as const;
