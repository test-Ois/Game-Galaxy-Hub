import type { LudoColor } from "@/shared/types/game";

export const LUDO_COLORS: LudoColor[] = ["red", "green", "yellow", "blue"];

export const COLOR_HEX = {
  red: "#EF4444",
  green: "#10B981",
  yellow: "#F59E0B",
  blue: "#3B82F6",
};

export const START_INDEX = { red: 0, green: 13, yellow: 26, blue: 39 };
export const SAFE_CELLS = [0, 8, 13, 21, 26, 34, 39, 47];

// Clockwise outer track coordinates (52 cells)
export const TRACK_COORDS = [
  { r: 6, c: 1 }, { r: 6, c: 2 }, { r: 6, c: 3 }, { r: 6, c: 4 }, { r: 6, c: 5 }, // Red start arm
  { r: 5, c: 6 }, { r: 4, c: 6 }, { r: 3, c: 6 }, { r: 2, c: 6 }, { r: 1, c: 6 }, { r: 0, c: 6 },
  { r: 0, c: 7 }, // Crossing
  { r: 0, c: 8 }, { r: 1, c: 8 }, { r: 2, c: 8 }, { r: 3, c: 8 }, { r: 4, c: 8 }, { r: 5, c: 8 }, // Green arm
  { r: 6, c: 9 }, { r: 6, c: 10 }, { r: 6, c: 11 }, { r: 6, c: 12 }, { r: 6, c: 13 }, { r: 6, c: 14 },
  { r: 7, c: 14 }, // Crossing
  { r: 8, c: 14 }, { r: 8, c: 13 }, { r: 8, c: 12 }, { r: 8, c: 11 }, { r: 8, c: 10 }, { r: 8, c: 9 }, // Yellow arm
  { r: 9, c: 8 }, { r: 10, c: 8 }, { r: 11, c: 8 }, { r: 12, c: 8 }, { r: 13, c: 8 }, { r: 14, c: 8 },
  { r: 14, c: 7 }, // Crossing
  { r: 14, c: 6 }, { r: 13, c: 6 }, { r: 12, c: 6 }, { r: 11, c: 6 }, { r: 10, c: 6 }, { r: 9, c: 6 }, // Blue arm
  { r: 8, c: 5 }, { r: 8, c: 4 }, { r: 8, c: 3 }, { r: 8, c: 2 }, { r: 8, c: 1 }, { r: 8, c: 0 },
  { r: 7, c: 0 }, { r: 6, c: 0 } // Crossing Red arm end
];

// Home path coordinates (5 cells each)
export const HOME_PATH_COORDS = {
  red: [
    { r: 7, c: 1 }, { r: 7, c: 2 }, { r: 7, c: 3 }, { r: 7, c: 4 }, { r: 7, c: 5 }
  ],
  green: [
    { r: 1, c: 7 }, { r: 2, c: 7 }, { r: 3, c: 7 }, { r: 4, c: 7 }, { r: 5, c: 7 }
  ],
  yellow: [
    { r: 7, c: 13 }, { r: 7, c: 12 }, { r: 7, c: 11 }, { r: 7, c: 10 }, { r: 7, c: 9 }
  ],
  blue: [
    { r: 13, c: 7 }, { r: 12, c: 7 }, { r: 11, c: 7 }, { r: 10, c: 7 }, { r: 9, c: 7 }
  ]
};

// Goals
export const GOAL_COORDS = {
  red: { r: 7, c: 6 },
  green: { r: 6, c: 7 },
  yellow: { r: 7, c: 8 },
  blue: { r: 8, c: 7 }
};

// Base spots (4 each)
export const BASE_SPOTS = {
  red: [
    { r: 2, c: 2 }, { r: 2, c: 3 }, { r: 3, c: 2 }, { r: 3, c: 3 }
  ],
  green: [
    { r: 2, c: 11 }, { r: 2, c: 12 }, { r: 3, c: 11 }, { r: 3, c: 12 }
  ],
  yellow: [
    { r: 11, c: 11 }, { r: 11, c: 12 }, { r: 12, c: 11 }, { r: 12, c: 12 }
  ],
  blue: [
    { r: 11, c: 2 }, { r: 11, c: 3 }, { r: 12, c: 2 }, { r: 12, c: 3 }
  ]
};

// Helper to fetch grid coordinates of a token (Online/Server version)
export const getTokenGridCell = (color: LudoColor, tokenIdx: number, stepPos: number) => {
  if (stepPos === -1) {
    return BASE_SPOTS[color][tokenIdx];
  }
  if (stepPos >= 0 && stepPos <= 50) {
    const absCell = (START_INDEX[color] + stepPos) % 52;
    return TRACK_COORDS[absCell];
  }
  if (stepPos >= 51 && stepPos <= 55) {
    return HOME_PATH_COORDS[color][stepPos - 51];
  }
  return GOAL_COORDS[color];
};

// Helper to fetch grid coordinates of a token (Offline/Client version)
export const getTokenCoordinate = (color: LudoColor, tokenIndex: number, pos: number) => {
  if (pos === -1) return BASE_SPOTS[color][tokenIndex];
  if (pos === 56) return GOAL_COORDS[color];
  if (pos >= 52) return HOME_PATH_COORDS[color][pos - 52];
  const globalIdx = (START_INDEX[color] + pos) % 52;
  return TRACK_COORDS[globalIdx];
};
