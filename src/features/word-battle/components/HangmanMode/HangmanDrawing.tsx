"use client";

import { motion } from "framer-motion";

interface HangmanDrawingProps {
  livesLost: number; // 0–6
}

const STROKE = {
  strokeWidth: "4",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  stroke: "currentColor",
  fill: "none",
};

export function HangmanDrawing({ livesLost }: HangmanDrawingProps) {
  const parts = [
    // 1 — gallows base
    <line key="base" x1="10" y1="190" x2="130" y2="190" {...STROKE} />,
    // 2 — gallows pole
    <line key="pole" x1="60" y1="190" x2="60" y2="20" {...STROKE} />,
    // 3 — gallows top bar
    <line key="topbar" x1="60" y1="20" x2="130" y2="20" {...STROKE} />,
    // 4 — rope
    <line key="rope" x1="130" y1="20" x2="130" y2="45" {...STROKE} />,
    // 5 — head
    <circle key="head" cx="130" cy="60" r="15" {...STROKE} />,
    // 6 — body
    <line key="body" x1="130" y1="75" x2="130" y2="130" {...STROKE} />,
    // 7 — left arm
    <line key="larm" x1="130" y1="90" x2="105" y2="115" {...STROKE} />,
    // 8 — right arm
    <line key="rarm" x1="130" y1="90" x2="155" y2="115" {...STROKE} />,
    // 9 — left leg
    <line key="lleg" x1="130" y1="130" x2="105" y2="160" {...STROKE} />,
    // 10 — right leg
    <line key="rleg" x1="130" y1="130" x2="155" y2="160" {...STROKE} />,
  ];

  // Map livesLost (0–6) to parts shown — show gallows scaffold immediately,
  // then reveal body parts incrementally
  // parts[0..3] = gallows always visible; parts[4..9] = body parts
  const alwaysVisible = 4; // base, pole, bar, rope
  const bodyPartsToShow = livesLost;
  const visibleCount = alwaysVisible + bodyPartsToShow;

  const isDefeated = livesLost >= 6;

  return (
    <svg
      viewBox="0 0 200 210"
      className="w-full h-full"
      aria-label={`Hangman drawing: ${livesLost} of 6 parts shown`}
    >
      {/* Scaffold — always visible */}
      {parts.slice(0, alwaysVisible).map((part) => (
        <g key={(part as React.ReactElement).key} className="text-foreground/60">
          {part}
        </g>
      ))}

      {/* Body parts — revealed as lives are lost */}
      {parts.slice(alwaysVisible, visibleCount).map((part, i) => {
        const partKey = (part as React.ReactElement).key as string;
        const isHead = partKey === "head";
        const isLast = i === bodyPartsToShow - 1;
        return (
          <motion.g
            key={partKey}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={
              isDefeated
                ? "text-rose-500"
                : isLast
                ? "text-amber-500"
                : "text-foreground/80"
            }
          >
            {isHead ? (
              // Colour the eyes on defeat
              <>
                {part}
                {isDefeated && (
                  <>
                    <line x1="124" y1="55" x2="128" y2="59" strokeWidth="2" stroke="currentColor" />
                    <line x1="128" y1="55" x2="124" y2="59" strokeWidth="2" stroke="currentColor" />
                    <line x1="132" y1="55" x2="136" y2="59" strokeWidth="2" stroke="currentColor" />
                    <line x1="136" y1="55" x2="132" y2="59" strokeWidth="2" stroke="currentColor" />
                  </>
                )}
              </>
            ) : (
              part
            )}
          </motion.g>
        );
      })}
    </svg>
  );
}
