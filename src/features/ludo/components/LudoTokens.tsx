// ============================================================
// LudoTokens Component — Overlay Player Token Layer
// ============================================================

"use client";

import { motion } from "framer-motion";
import { cn } from "@/shared/services/utils";
import { COLOR_HEX } from "../constants/coordinates";
import type { LudoColor } from "@/shared/types/game";

interface GroupedToken {
  color: LudoColor;
  index: number;
  validMove: boolean;
}

interface LudoTokensProps {
  coordinatesGroups: Record<string, GroupedToken[]>;
  onTokenClick: (color: LudoColor, tokenIndex: number) => void;
}

export function LudoTokens({ coordinatesGroups, onTokenClick }: LudoTokensProps) {
  return (
    <>
      {Object.keys(coordinatesGroups).map((coordKey) => {
        const group = coordinatesGroups[coordKey];
        const [rStr, cStr] = coordKey.split("-");
        const row = parseInt(rStr, 10);
        const col = parseInt(cStr, 10);

        const topPct = (row / 15) * 100;
        const leftPct = (col / 15) * 100;

        return (
          <div
            key={`tokens-${coordKey}`}
            style={{
              position: "absolute",
              top: `${topPct}%`,
              left: `${leftPct}%`,
              width: `${100 / 15}%`,
              height: `${100 / 15}%`,
            }}
            className="flex items-center justify-center p-0.5 select-none z-10"
          >
            <div
              className={cn(
                "grid gap-[1px] items-center justify-center w-full h-full",
                group.length === 1
                  ? "grid-cols-1"
                  : group.length <= 2
                  ? "grid-cols-2"
                  : "grid-cols-2 grid-rows-2"
              )}
            >
              {group.map((token) => {
                const tokenColorHex = COLOR_HEX[token.color] || "#EF4444";

                return (
                  <motion.button
                    key={`${token.color}-${token.index}`}
                    onClick={() => onTokenClick(token.color, token.index)}
                    animate={token.validMove ? { scale: [1, 1.18, 1], y: [0, -4, 0] } : {}}
                    transition={{ repeat: Infinity, duration: 1.0 }}
                    style={{
                      backgroundColor: tokenColorHex,
                    }}
                    className={cn(
                      "rounded-full border-2 border-white shadow-xl flex items-center justify-center font-black select-none transition-all relative overflow-hidden bg-gradient-to-t from-black/20 to-white/35",
                      group.length === 1 ? "h-6.5 w-6.5 text-[10px]" : "h-4.5 w-4.5 text-[8px]",
                      token.validMove
                        ? "ring-2 ring-yellow-400 ring-offset-1 ring-offset-black cursor-pointer shadow-yellow-400/40 brightness-110 scale-105"
                        : "cursor-default opacity-90"
                    )}
                  >
                    {/* Glossy overlay */}
                    <div className="absolute inset-0.5 rounded-full bg-white/20 border border-white/10 pointer-events-none" />
                    <span className="text-white drop-shadow-[0_1.5px_1.5px_rgba(0,0,0,0.8)] select-none z-10">
                      {token.index + 1}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}
