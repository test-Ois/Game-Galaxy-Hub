// ============================================================
// LudoBoard — classic bright 15x15 Ludo board
// ============================================================
"use client";

import React from "react";
import { cn } from "@/shared/services/utils";
import { BASE_SPOTS, SAFE_CELLS, TRACK_COORDS } from "../constants/coordinates";

interface LudoBoardProps { children?: React.ReactNode; }

const BOARD_CELLS = Array.from({ length: 225 }, (_, index) => {
  const r = Math.floor(index / 15);
  const c = index % 15;
  const isTrack = TRACK_COORDS.some((cell) => cell.r === r && cell.c === c);
  const isHomeLane =
    (r === 7 && c >= 1 && c <= 5) ||
    (c === 7 && r >= 1 && r <= 5) ||
    (r === 7 && c >= 9 && c <= 13) ||
    (c === 7 && r >= 9 && r <= 13);
  const inCenter = r >= 6 && r <= 8 && c >= 6 && c <= 8;
  const inRedBase = r <= 5 && c <= 5;
  const inGreenBase = r <= 5 && c >= 9;
  const inYellowBase = r >= 9 && c >= 9;
  const inBlueBase = r >= 9 && c <= 5;
  const baseColor = inRedBase ? "red" : inGreenBase ? "green" : inYellowBase ? "yellow" : inBlueBase ? "blue" : null;
  const isBaseSpot = Object.values(BASE_SPOTS).flat().some((cell) => cell.r === r && cell.c === c);
  const inHomeSquare = (r >= 1 && r <= 4 && c >= 1 && c <= 4) || (r >= 1 && r <= 4 && c >= 10 && c <= 13) || (r >= 10 && r <= 13 && c >= 10 && c <= 13) || (r >= 10 && r <= 13 && c >= 1 && c <= 4);
  const isSafeCell = SAFE_CELLS.some((trackIndex) => TRACK_COORDS[trackIndex]?.r === r && TRACK_COORDS[trackIndex]?.c === c);
  let cellColor = "bg-white";
  if (baseColor === "red") cellColor = "bg-[#f11f2c]";
  if (baseColor === "green") cellColor = "bg-[#079b50]";
  if (baseColor === "yellow") cellColor = "bg-[#ffe51b]";
  if (baseColor === "blue") cellColor = "bg-[#20a9ed]";
  if (isTrack) cellColor = "bg-white";
  if (inHomeSquare) cellColor = "bg-white";
  if (isHomeLane) {
    if (r === 7 && c >= 1 && c <= 5) cellColor = "bg-[#ed1c2a]";
    else if (c === 7 && r >= 1 && r <= 5) cellColor = "bg-[#079b50]";
    else if (r === 7 && c >= 9 && c <= 13) cellColor = "bg-[#ffe51b]";
    else cellColor = "bg-[#20a9ed]";
  }
  if (inCenter) cellColor = "bg-white";
  return { key: `cell-${r}-${c}`, r, c, cellColor, baseColor, isBaseSpot, isSafeCell, inCenter };
});

function CenterHub() {
  return (
    <div className="absolute z-[5] pointer-events-none" style={{ left: "40%", top: "40%", width: "20%", height: "20%" }}>
      <div className="relative w-full h-full overflow-hidden border border-slate-500/70">
        <div className="absolute inset-0" style={{ background: "#079b50", clipPath: "polygon(0 0,100% 0,50% 50%)" }} />
        <div className="absolute inset-0" style={{ background: "#ffe51b", clipPath: "polygon(100% 0,100% 100%,50% 50%)" }} />
        <div className="absolute inset-0" style={{ background: "#20a9ed", clipPath: "polygon(100% 100%,0 100%,50% 50%)" }} />
        <div className="absolute inset-0" style={{ background: "#ed1c2a", clipPath: "polygon(0 100%,0 0,50% 50%)" }} />
      </div>
    </div>
  );
}

export function LudoBoard({ children }: LudoBoardProps) {
  return (
    <div className="relative aspect-square w-[min(96vw,760px)] sm:w-[min(88vw,760px)] shrink-0 border-[3px] sm:border-4 border-slate-300 rounded-sm p-0 bg-white shadow-[0_10px_32px_rgba(0,0,0,0.35)] overflow-hidden">
      <div className="grid grid-cols-15 grid-rows-15 w-full h-full gap-0 bg-slate-400">
        {BOARD_CELLS.map(({ key, r, c, cellColor, baseColor, isBaseSpot, isSafeCell, inCenter }) => (
          <div
            key={key}
            className={cn(
              "relative flex items-center justify-center border-[0.5px] border-slate-500/70 min-w-0 min-h-0",
              cellColor,
              baseColor && !isBaseSpot && !inCenter ? "border-transparent" : "",
              isBaseSpot ? "border-transparent" : ""
            )}
          >
            {isBaseSpot && baseColor && (
              <div className={cn(
                "h-[78%] w-[78%] rounded-full border border-white/90 shadow-[inset_0_1px_2px_rgba(0,0,0,0.16)]",
                baseColor === "red" ? "bg-[#ed1c2a]" :
                baseColor === "green" ? "bg-[#079b50]" :
                baseColor === "yellow" ? "bg-[#ffe51b]" : "bg-[#20a9ed]"
              )} />
            )}
            {isSafeCell && !inCenter && (
              <span className="relative z-[2] text-slate-500 leading-none text-[clamp(5px,1.6vw,14px)]">☆</span>
            )}
          </div>
        ))}
      </div>
      <CenterHub />
      {children}
    </div>
  );
}
