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
