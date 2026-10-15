"use client";

import React from "react";
import { cn } from "@/shared/services/utils";
import {
  BASE_SPOTS,
  COLOR_HEX,
  GOAL_COORDS,
  HOME_PATH_COORDS,
  SAFE_CELLS,
  TRACK_COORDS,
} from "../constants/coordinates";
import type { LudoColor } from "@/shared/types/game";

interface LudoBoardProps {
  children?: React.ReactNode;
}

const HOME_ZONES: {
  color: LudoColor;
  label: string;
  top: string;
  left: string;
}[] = [
  { color: "red", label: "RED", top: "0%", left: "0%" },
  { color: "green", label: "GREEN", top: "0%", left: "60%" },
  { color: "blue", label: "BLUE", top: "60%", left: "0%" },
  { color: "yellow", label: "YELLOW", top: "60%", left: "60%" },
];

const keyOf = (r: number, c: number) => `${r}-${c}`;

export function LudoBoard({ children }: LudoBoardProps) {
  const track = new Set(TRACK_COORDS.map(({ r, c }) => keyOf(r, c)));
  const homeLanes = new Map<string, LudoColor>();
  (Object.keys(HOME_PATH_COORDS) as LudoColor[]).forEach((color) => {
    HOME_PATH_COORDS[color].forEach(({ r, c }) => homeLanes.set(keyOf(r, c), color));
  });
  const starts = new Map<LudoColor, string>([
    ["red", keyOf(6, 1)],
    ["green", keyOf(1, 8)],
    ["yellow", keyOf(8, 13)],
    ["blue", keyOf(13, 6)],
  ]);
  const startCells = new Map([...starts].map(([color, cell]) => [cell, color]));
  const safeCells = new Set(SAFE_CELLS.map((index) => keyOf(TRACK_COORDS[index].r, TRACK_COORDS[index].c)));

  return (
    <div className="relative isolate aspect-square w-full max-w-[94vw] sm:max-w-[440px] md:max-w-[500px] rounded-[22px] border-[5px] border-[#c98b45] bg-[#5d351e] p-[5px] shadow-[0_20px_55px_rgba(0,0,0,0.38),inset_0_0_0_2px_rgba(255,235,190,0.35)]">
      <div
        className="relative grid h-full w-full overflow-hidden rounded-[13px] bg-[#f7f0dc]"
        style={{ gridTemplateColumns: "repeat(15, minmax(0, 1fr))", gridTemplateRows: "repeat(15, minmax(0, 1fr))", gap: "1px" }}
      >
        {Array.from({ length: 225 }, (_, index) => {
          const r = Math.floor(index / 15);
          const c = index % 15;
          const cell = keyOf(r, c);
          const laneColor = homeLanes.get(cell);
          const startColor = startCells.get(cell);
          const isTrack = track.has(cell);
          const isSafe = safeCells.has(cell);
          const inCenter = r >= 6 && r <= 8 && c >= 6 && c <= 8;
          const inCorner = (r < 6 && c < 6) || (r < 6 && c > 8) || (r > 8 && c < 6) || (r > 8 && c > 8);

          let background = inCorner ? "#eadfc9" : "#fffdf6";
          if (isTrack) background = "#fffdf6";
          if (laneColor) background = COLOR_HEX[laneColor];
          if (startColor) background = COLOR_HEX[startColor];
          if (inCenter) background = "#fffdf6";

          return (
            <div
              key={cell}
              className={cn(
                "relative flex min-h-0 min-w-0 items-center justify-center",
                isTrack && "border border-[#d7cdb8]",
                isSafe && "after:absolute after:inset-[16%] after:rounded-full after:border after:border-[#d4a54a]"
              )}
              style={{ backgroundColor: background }}
            >
              {isSafe && !startColor && (
                <span className="select-none text-[clamp(5px,1.25vw,10px)] font-black leading-none text-[#bd8a28]">★</span>
              )}
              {startColor && (
                <span className="select-none text-[clamp(5px,1.1vw,9px)] font-black leading-none text-white drop-shadow">▶</span>
              )}
              {isTrack && !isSafe && !startColor && (
                <span className="pointer-events-none absolute inset-[12%] rounded-full border border-[#e8dfcd]/70" />
              )}
            </div>
          );
        })}
      </div>

      {/* Raised home yards sit above the grid, but below the moving tokens. */}
      {HOME_ZONES.map(({ color, label, top, left }) => (
        <div
          key={color}
          className="pointer-events-none absolute z-[2] flex items-center justify-center rounded-[10px] p-[2.2%]"
          style={{
            top,
            left,
            width: "40%",
            height: "40%",
            background: `linear-gradient(145deg, ${COLOR_HEX[color]}, ${COLOR_HEX[color]}dd)`,
            boxShadow: "inset 0 2px 5px rgba(255,255,255,.28), inset 0 -5px 10px rgba(0,0,0,.16)",
          }}
        >
          <div className="flex h-full w-full flex-col items-center justify-center rounded-[8px] border border-white/75 bg-[#fffaf0] p-[7%] shadow-[inset_0_2px_8px_rgba(74,45,20,0.12)]">
            <span
              className="mb-[5%] text-[clamp(6px,1.6vw,11px)] font-black tracking-[0.18em]"
              style={{ color: COLOR_HEX[color] }}
            >
              {label}
            </span>
            <div className="grid w-[84%] grid-cols-2 grid-rows-2 gap-[8%]">
              {BASE_SPOTS[color].map((spot, index) => (
                <div
                  key={`${spot.r}-${spot.c}-${index}`}
                  className="aspect-square rounded-full border-[2px] border-white p-[12%] shadow-[0_2px_4px_rgba(0,0,0,.2)]"
                  style={{ backgroundColor: `${COLOR_HEX[color]}25` }}
                >
                  <div
                    className="h-full w-full rounded-full border border-black/10"
                    style={{ backgroundColor: COLOR_HEX[color] }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Four-colour finish triangle in the classic Ludo centre. */}
      <div
        className="pointer-events-none absolute z-[3] overflow-hidden border border-[#d7cdb8] shadow-[0_2px_8px_rgba(0,0,0,.16)]"
        style={{ top: "40%", left: "40%", width: "20%", height: "20%", background: "#fffdf6" }}
      >
        <div className="absolute inset-0" style={{ backgroundColor: COLOR_HEX.green, clipPath: "polygon(0 0, 100% 0, 50% 50%)" }} />
        <div className="absolute inset-0" style={{ backgroundColor: COLOR_HEX.yellow, clipPath: "polygon(100% 0, 100% 100%, 50% 50%)" }} />
        <div className="absolute inset-0" style={{ backgroundColor: COLOR_HEX.blue, clipPath: "polygon(100% 100%, 0 100%, 50% 50%)" }} />
        <div className="absolute inset-0" style={{ backgroundColor: COLOR_HEX.red, clipPath: "polygon(0 100%, 0 0, 50% 50%)" }} />
        <div className="absolute left-1/2 top-1/2 h-[18%] w-[18%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#fffaf0] shadow" />
      </div>

      {/* Token layer is intentionally last so tokens remain clickable above all board art. */}
      <div className="pointer-events-none absolute inset-0 z-[10]">
        {children}
      </div>
    </div>
  );
}
