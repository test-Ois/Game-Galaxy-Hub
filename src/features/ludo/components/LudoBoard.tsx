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

export function LudoBoard({ children }: LudoBoardProps) {
  return (
    <div className="relative aspect-square w-full max-w-[85vw] sm:max-w-md md:max-w-lg border-8 border-amber-600/40 rounded-3xl p-1.5 bg-neutral-900 shadow-2xl overflow-hidden">
      <div className="grid grid-cols-15 grid-rows-15 w-full h-full gap-[1.5px] bg-neutral-800 rounded-2xl overflow-hidden">
        {Array.from({ length: 15 }).map((_, rIdx) =>
          Array.from({ length: 15 }).map((_, cIdx) => {
            let cellColor = "bg-neutral-900/90";
            const isSafeCell = SAFE_CELLS.some(
              (idx) => TRACK_COORDS[idx].r === rIdx && TRACK_COORDS[idx].c === cIdx
            );

            // Home Yards Redesign with gradients
            if (rIdx < 6 && cIdx < 6) cellColor = "bg-red-950/20";
            else if (rIdx < 6 && cIdx > 8) cellColor = "bg-emerald-950/20";
            else if (rIdx > 8 && cIdx > 8) cellColor = "bg-amber-950/20";
            else if (rIdx > 8 && cIdx < 6) cellColor = "bg-blue-950/20";

            // Home Paths Redesign
            if (rIdx === 7 && cIdx >= 1 && cIdx <= 5) cellColor = "bg-gradient-to-r from-red-600/60 to-red-500/95";
            else if (cIdx === 7 && rIdx >= 1 && rIdx <= 5) cellColor = "bg-gradient-to-b from-emerald-600/60 to-emerald-500/95";
            else if (rIdx === 7 && cIdx >= 9 && cIdx <= 13) cellColor = "bg-gradient-to-l from-amber-600/60 to-amber-500/95";
            else if (cIdx === 7 && rIdx >= 9 && rIdx <= 13) cellColor = "bg-gradient-to-t from-blue-600/60 to-blue-500/95";

            // Center Finish Area Redesign
            if (rIdx >= 6 && rIdx <= 8 && cIdx >= 6 && cIdx <= 8) {
              cellColor = "bg-neutral-850/80";
            }

            // Start Points Redesign
            if (rIdx === 6 && cIdx === 1) cellColor = "bg-gradient-to-r from-red-500 to-red-600 border border-red-300/30";
            if (rIdx === 1 && cIdx === 8) cellColor = "bg-gradient-to-b from-emerald-500 to-emerald-600 border border-emerald-300/30";
            if (rIdx === 8 && cIdx === 13) cellColor = "bg-gradient-to-l from-amber-500 to-amber-600 border border-amber-300/30";
            if (rIdx === 13 && cIdx === 6) cellColor = "bg-gradient-to-t from-blue-500 to-blue-600 border border-blue-300/30";

            return (
              <div
                key={`cell-${rIdx}-${cIdx}`}
                className={cn(
                  "relative rounded-[3px] flex items-center justify-center border border-neutral-800/40 text-[8px] transition-all",
                  cellColor
                )}
              >
                {/* Safe Cells Redesign */}
                {isSafeCell && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-40 select-none text-yellow-400 font-extrabold text-sm scale-110">
                    ★
                  </div>
                )}

                {/* Base Spots Rings */}
                {((rIdx === 1 || rIdx === 4) && (cIdx === 1 || cIdx === 4 || cIdx === 10 || cIdx === 13)) ||
                ((rIdx === 10 || rIdx === 13) && (cIdx === 1 || cIdx === 4 || cIdx === 10 || cIdx === 13)) ? (
                  <div className="h-7 w-7 rounded-full bg-black/35 border border-white/10 shadow-inner flex items-center justify-center" />
                ) : null}
              </div>
            );
          })
        )}
      </div>

      {/* RENDER TOKENS LAYER */}
      {children}
    </div>
  );
}
