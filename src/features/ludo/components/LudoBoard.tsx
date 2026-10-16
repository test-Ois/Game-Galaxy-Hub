// ============================================================
// LudoBoard Component — Premium 15x15 Grid Layout
// ============================================================

"use client";

import React from "react";
import { cn } from "@/shared/services/utils";
import { SAFE_CELLS, TRACK_COORDS } from "../constants/coordinates";

interface LudoBoardProps {
  children?: React.ReactNode;
}

interface BoardCell {
  key: string;
  className: string;
  isSafeCell: boolean;
  isBaseSpot: boolean;
}

// Compute the static 15x15 board once instead of repeating coordinate
// lookups and nested Array.from allocations on every dice/token state update.
const BOARD_CELLS: BoardCell[] = Array.from({ length: 225 }, (_, index) => {
  const rIdx = Math.floor(index / 15);
  const cIdx = index % 15;
  let cellColor = "bg-neutral-900/90";

  const isSafeCell = SAFE_CELLS.some(
    (trackIndex) =>
      TRACK_COORDS[trackIndex].r === rIdx &&
      TRACK_COORDS[trackIndex].c === cIdx
  );

  if (rIdx < 6 && cIdx < 6) cellColor = "bg-gradient-to-br from-rose-950/80 via-red-950/65 to-rose-900/50";
  else if (rIdx < 6 && cIdx > 8) cellColor = "bg-gradient-to-br from-emerald-950/80 via-green-950/65 to-emerald-900/50";
  else if (rIdx > 8 && cIdx > 8) cellColor = "bg-gradient-to-br from-amber-950/80 via-orange-950/65 to-amber-900/50";
  else if (rIdx > 8 && cIdx < 6) cellColor = "bg-gradient-to-br from-blue-950/80 via-sky-950/65 to-blue-900/50";

  if (rIdx === 7 && cIdx >= 1 && cIdx <= 5) cellColor = "bg-gradient-to-r from-red-600/60 to-red-500/95";
  else if (cIdx === 7 && rIdx >= 1 && rIdx <= 5) cellColor = "bg-gradient-to-b from-emerald-600/60 to-emerald-500/95";
  else if (rIdx === 7 && cIdx >= 9 && cIdx <= 13) cellColor = "bg-gradient-to-l from-amber-600/60 to-amber-500/95";
  else if (cIdx === 7 && rIdx >= 9 && rIdx <= 13) cellColor = "bg-gradient-to-t from-blue-600/60 to-blue-500/95";

  if (rIdx >= 6 && rIdx <= 8 && cIdx >= 6 && cIdx <= 8) {
    cellColor = "bg-neutral-850/80";
  }

  if (rIdx === 6 && cIdx === 1) cellColor = "bg-gradient-to-r from-red-500 to-red-600 border border-red-300/30";
  if (rIdx === 1 && cIdx === 8) cellColor = "bg-gradient-to-b from-emerald-500 to-emerald-600 border border-emerald-300/30";
  if (rIdx === 8 && cIdx === 13) cellColor = "bg-gradient-to-l from-amber-500 to-amber-600 border border-amber-300/30";
  if (rIdx === 13 && cIdx === 6) cellColor = "bg-gradient-to-t from-blue-500 to-blue-600 border border-blue-300/30";

  const isBaseSpot =
    ((rIdx === 1 || rIdx === 4) &&
      (cIdx === 1 || cIdx === 4 || cIdx === 10 || cIdx === 13)) ||
    ((rIdx === 10 || rIdx === 13) &&
      (cIdx === 1 || cIdx === 4 || cIdx === 10 || cIdx === 13));

  return {
    key: `cell-${rIdx}-${cIdx}`,
    className: cellColor,
    isSafeCell,
    isBaseSpot,
  };
});

export function LudoBoard({ children }: LudoBoardProps) {
  return (
    <div className="relative aspect-square w-[min(96vw,760px)] sm:w-[min(88vw,760px)] shrink-0 border-[5px] sm:border-[9px] border-amber-700/80 rounded-[1.35rem] sm:rounded-[2rem] p-1 sm:p-1.5 bg-gradient-to-br from-amber-300 via-amber-800 to-yellow-950 shadow-[0_12px_36px_rgba(0,0,0,0.55),inset_0_2px_4px_rgba(255,255,255,0.25)] overflow-hidden">
      <div className="grid grid-cols-15 grid-rows-15 w-full h-full gap-px bg-stone-950 rounded-[0.9rem] sm:rounded-[1.4rem] overflow-hidden shadow-inner">
        {BOARD_CELLS.map(({ key, className, isSafeCell, isBaseSpot }) => (
          <div
            key={key}
            className={cn(
              "relative rounded-[2px] flex items-center justify-center border border-black/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)] text-[8px]",
              className
            )}
          >
            {isSafeCell && (
              <div className="absolute inset-0 flex items-center justify-center opacity-40 select-none text-yellow-400 font-extrabold text-[clamp(6px,1.8vw,14px)]">
                ★
              </div>
            )}
            {isBaseSpot && (
              <div className="h-[55%] w-[55%] rounded-full bg-black/35 border border-white/10 shadow-inner flex items-center justify-center" />
            )}
          </div>
        ))}
      </div>

      {children}
    </div>
  );
}
