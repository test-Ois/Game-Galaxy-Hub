// ============================================================
// Game Constants
// ============================================================

export const GAME_CONFIG = {
  /** Delay before AI makes a move (ms) — for UX */
  AI_MOVE_DELAY: 400,

  /** Default board size */
  DEFAULT_BOARD_SIZE: 3 as const,

  /** Default series mode */
  DEFAULT_SERIES: 3 as const,

  /** Animation durations */
  ANIM: {
    CELL_ENTER: 0.2,
    CELL_HOVER: 0.15,
    WIN_LINE: 0.6,
    MODAL_ENTER: 0.3,
    PAGE_TRANSITION: 0.4,
    SCORE_COUNT: 0.5,
  },
} as const;

export const ACHIEVEMENTS_LIST = [
  {
    id: "first-blood",
    name: "First Blood",
    description: "Win your first game",
    icon: "🎯",
    xpReward: 20,
    condition: { type: "wins", count: 1 },
  },
  {
    id: "strategist",
    name: "Strategist",
    description: "Win 10 games against Hard AI",
    icon: "🧠",
    xpReward: 100,
    condition: { type: "hard_wins", count: 10 },
  },
  {
    id: "unbeatable",
    name: "Unbeatable",
    description: "Win 5 games in a row",
    icon: "🔥",
    xpReward: 75,
    condition: { type: "win_streak", count: 5 },
  },
  {
    id: "speed-demon",
    name: "Speed Demon",
    description: "Win a game in under 10 seconds",
    icon: "⚡",
    xpReward: 50,
    condition: { type: "fast_win", seconds: 10 },
  },
  {
    id: "explorer",
    name: "Explorer",
    description: "Play on all board sizes",
    icon: "🗺️",
    xpReward: 30,
    condition: { type: "board_sizes", count: 3 },
  },
  {
    id: "centurion",
    name: "Centurion",
    description: "Play 100 total games",
    icon: "🏛️",
    xpReward: 150,
    condition: { type: "total_games", count: 100 },
  },
  {
    id: "perfect-series",
    name: "Perfect Series",
    description: "Win a Best of 5 series without losing a round",
    icon: "👑",
    xpReward: 100,
    condition: { type: "perfect_series", bestOf: 5 },
  },
  {
    id: "comeback-king",
    name: "Comeback King",
    description: "Win a series after being down 0-1",
    icon: "💪",
    xpReward: 60,
    condition: { type: "comeback", deficit: 1 },
  },
  {
    id: "night-owl",
    name: "Night Owl",
    description: "Play a game between midnight and 5 AM",
    icon: "🦉",
    xpReward: 15,
    condition: { type: "time_range", start: 0, end: 5 },
  },
  {
    id: "versatile",
    name: "Versatile",
    description: "Win a game on each difficulty level",
    icon: "🎭",
    xpReward: 40,
    condition: { type: "all_difficulties" },
  },
  {
    id: "grandmaster",
    name: "Grandmaster",
    description: "Reach the Grandmaster rank",
    icon: "♛",
    xpReward: 500,
    condition: { type: "rank", rank: "Grandmaster" },
  },
  {
    id: "marathon",
    name: "Marathon Runner",
    description: "Play for a total of 1 hour",
    icon: "🏃",
    xpReward: 50,
    condition: { type: "total_time", minutes: 60 },
  },
] as const;
