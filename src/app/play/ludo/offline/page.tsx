"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RefreshCw, LogOut, Play, Users, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSound } from "@/hooks/useSound";
import { cn } from "@/lib/utils";
import type { LudoColor } from "@/lib/game/types";

const COLOR_HEX = {
  red: "#EF4444",
  green: "#10B981",
  yellow: "#F59E0B",
  blue: "#3B82F6",
};

const START_INDEX = { red: 0, green: 13, yellow: 26, blue: 39 };
const SAFE_CELLS = [0, 8, 13, 21, 26, 34, 39, 47];

// Clockwise outer track coordinates (52 cells)
const TRACK_COORDS = [
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
const HOME_PATH_COORDS = {
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
const GOAL_COORDS = {
  red: { r: 7, c: 6 },
  green: { r: 6, c: 7 },
  yellow: { r: 7, c: 8 },
  blue: { r: 8, c: 7 }
};

// Base spots (4 each)
const BASE_SPOTS = {
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

// Map of player colors to indices based on player count
const COLOR_MAPPING_BY_COUNT = {
  2: ["red", "yellow"] as LudoColor[],
  3: ["red", "green", "yellow"] as LudoColor[],
  4: ["red", "green", "yellow", "blue"] as LudoColor[],
};

export default function LudoOfflinePage() {
  const router = useRouter();
  const { playClick, playDiceRoll, playTokenMove, playCapture, playHomeReach } = useSound();

  // Configuration Setup State
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4 | null>(null);
  const [isLobbyMode, setIsLobbyMode] = useState(true);

  // Gameplay State
  const [activeColors, setActiveColors] = useState<LudoColor[]>([]);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [diceRoll, setDiceRoll] = useState<number | null>(null);
  const [hasRolled, setHasRolled] = useState(false);
  const [tokens, setTokens] = useState<Record<LudoColor, number[]>>({
    red: [-1, -1, -1, -1],
    green: [-1, -1, -1, -1],
    yellow: [-1, -1, -1, -1],
    blue: [-1, -1, -1, -1],
  });
  const [animatedTokens, setAnimatedTokens] = useState<Record<LudoColor, number[]>>({
    red: [-1, -1, -1, -1],
    green: [-1, -1, -1, -1],
    yellow: [-1, -1, -1, -1],
    blue: [-1, -1, -1, -1],
  });
  const [isAnimating, setIsAnimating] = useState(false);
  const [rankings, setRankings] = useState<LudoColor[]>([]);
  const [isRollingAnimation, setIsRollingAnimation] = useState(false);
  const [tempDiceRoll, setTempDiceRoll] = useState<number | null>(null);
  const [gameMessage, setGameMessage] = useState("");

  // Dice value cycling during roll
  useEffect(() => {
    if (!isRollingAnimation) return;
    const interval = setInterval(() => {
      setTempDiceRoll(Math.floor(Math.random() * 6) + 1);
    }, 60);
    return () => {
      clearInterval(interval);
      setTempDiceRoll(null);
    };
  }, [isRollingAnimation]);

  const activeColor = activeColors[currentPlayerIdx] || "red";

  const renderDiceComponent = () => {
    const activeHex = COLOR_HEX[activeColor];
    const diceVal = tempDiceRoll !== null ? tempDiceRoll : diceRoll;

    const dotsMap: Record<number, number[]> = {
      1: [4],
      2: [0, 8],
      3: [0, 4, 8],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8]
    };
    const activeDots = diceVal !== null ? (dotsMap[diceVal] || []) : [];

    const handleRoll = () => {
      if (hasRolled || isRollingAnimation || isAnimating || rankings.includes(activeColor)) return;
      handleRollDice();
    };

    return (
      <div 
        style={{ perspective: "1000px" }}
        className="flex items-center justify-center shrink-0"
      >
        <motion.div
          onClick={handleRoll}
          animate={
            isRollingAnimation
              ? {
                  rotateX: [0, 180, 360, 540, 720],
                  rotateY: [0, 90, 270, 450, 720],
                  rotateZ: [0, 180, 360, 540, 720],
                  scale: [1, 1.25, 0.85, 1.15, 1],
                  z: [0, 50, -30, 20, 0]
                }
              : !hasRolled && !isAnimating
                ? {
                    scale: [1, 1.06, 1],
                    boxShadow: [
                      `0 0 8px ${activeHex}44`,
                      `0 0 20px ${activeHex}cc`,
                      `0 0 8px ${activeHex}44`
                    ]
                  }
                : {}
          }
          transition={
            isRollingAnimation
              ? { duration: 0.7, ease: "easeInOut" }
              : !hasRolled && !isAnimating
                ? { repeat: Infinity, duration: 1.2, ease: "easeInOut" }
                : {}
          }
          style={{
            borderBottomWidth: "4px",
            borderBottomColor: activeHex,
            filter: isRollingAnimation ? "blur(1.2px)" : "none",
            transformStyle: "preserve-3d"
          }}
          className={cn(
            "h-15 w-15 rounded-2xl bg-white border-2 border-slate-300 flex items-center justify-center shadow-lg select-none transition-all",
            !hasRolled && !isRollingAnimation && !isAnimating
              ? "cursor-pointer border-primary animate-bounce animate-duration-1000"
              : "text-foreground cursor-default"
          )}
        >
          {diceVal === null ? (
            <div className="font-extrabold text-muted-foreground/60 select-none text-xl">?</div>
          ) : (
            <div className="grid grid-cols-3 grid-rows-3 gap-1.5 w-8 h-8 p-0.5">
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full transition-all duration-200 bg-slate-900",
                    activeDots.includes(i) ? "opacity-100 scale-100" : "opacity-0 scale-50"
                  )}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    );
  };

  // Calculate starting active colors when player count is chosen
  const startOfflineGame = (count: 2 | 3 | 4) => {
    playClick();
    const colors = COLOR_MAPPING_BY_COUNT[count];
    setPlayerCount(count);
    setActiveColors(colors);
    setIsLobbyMode(false);
    setCurrentPlayerIdx(0);
    setDiceRoll(null);
    setHasRolled(false);
    setTokens({
      red: [-1, -1, -1, -1],
      green: [-1, -1, -1, -1],
      yellow: [-1, -1, -1, -1],
      blue: [-1, -1, -1, -1],
    });
    setAnimatedTokens({
      red: [-1, -1, -1, -1],
      green: [-1, -1, -1, -1],
      yellow: [-1, -1, -1, -1],
      blue: [-1, -1, -1, -1],
    });
    setRankings([]);
    setGameMessage("Red starts the game! Roll the dice.");
  };

  // Roll Dice
  const handleRollDice = () => {
    if (hasRolled || isRollingAnimation || isAnimating || rankings.length >= activeColors.length - 1) return;
    
    playDiceRoll();
    setIsRollingAnimation(true);
    setGameMessage("");

    setTimeout(() => {
      const roll = Math.floor(Math.random() * 6) + 1;
      setDiceRoll(roll);
      setHasRolled(true);
      setIsRollingAnimation(false);

      // Check valid moves
      const validMoves = getValidMovesForColor(activeColor, roll);
      if (validMoves.length === 0) {
        setGameMessage(`No valid moves for ${activeColor.toUpperCase()}! Passing turn...`);
        setTimeout(() => {
          advanceTurn(false);
        }, 1500);
      } else {
        setGameMessage(`Select a highlighted ${activeColor.toUpperCase()} token to move.`);
      }
    }, 800);
  };

  // Get valid moves
  const getValidMovesForColor = (color: LudoColor, roll: number): number[] => {
    const playerTokens = tokens[color];
    const valid: number[] = [];

    playerTokens.forEach((pos, idx) => {
      if (pos === -1) {
        if (roll === 6) valid.push(idx);
      } else if (pos + roll <= 56) {
        valid.push(idx);
      }
    });

    return valid;
  };

  // Advance turn
  const advanceTurn = (extraTurn: boolean) => {
    setDiceRoll(null);
    setHasRolled(false);

    if (rankings.length >= activeColors.length - 1) {
      setGameMessage("The game is complete! Restart to play again.");
      return;
    }

    let nextIdx = currentPlayerIdx;
    if (!extraTurn) {
      do {
        nextIdx = (nextIdx + 1) % activeColors.length;
      } while (
        rankings.includes(activeColors[nextIdx]) &&
        rankings.length < activeColors.length
      );
    }

    setCurrentPlayerIdx(nextIdx);
    const nextColor = activeColors[nextIdx];
    setGameMessage(`${nextColor.toUpperCase()}'s turn! Roll the dice.`);
  };

  // Move Token with Cell-by-Cell Animation
  const handleTokenClick = (color: LudoColor, tokenIdx: number) => {
    if (isAnimating || !hasRolled || color !== activeColor || diceRoll === null) return;

    const validMoves = getValidMovesForColor(color, diceRoll);
    if (!validMoves.includes(tokenIdx)) return;

    setIsAnimating(true);
    const playerTokens = [...tokens[color]];
    const startPos = playerTokens[tokenIdx];
    const endPos = startPos === -1 ? 0 : startPos + diceRoll;

    // Build step sequence
    const steps: number[] = [];
    if (startPos === -1) {
      steps.push(0);
    } else {
      for (let p = startPos + 1; p <= endPos; p++) {
        steps.push(p);
      }
    }

    let stepIdx = 0;
    const runStep = () => {
      if (stepIdx < steps.length) {
        const nextPos = steps[stepIdx];
        playTokenMove();

        setAnimatedTokens((prev) => {
          const next = { ...prev };
          next[color] = [...next[color]];
          next[color][tokenIdx] = nextPos;
          return next;
        });

        stepIdx++;
        setTimeout(runStep, 180); // 180ms delay per step
      } else {
        finalizeMove(color, tokenIdx, startPos, endPos);
      }
    };

    runStep();
  };

  // Finalize move parameters (captures, goals, turn advancement)
  const finalizeMove = (color: LudoColor, tokenIdx: number, startPos: number, endPos: number) => {
    const playerTokens = [...tokens[color]];
    playerTokens[tokenIdx] = endPos;

    let captureOccurred = false;
    const updatedTokens = { ...tokens, [color]: playerTokens };
    const updatedAnimated = { ...animatedTokens };
    updatedAnimated[color] = [...updatedAnimated[color]];
    updatedAnimated[color][tokenIdx] = endPos;

    // Capture Check
    if (endPos < 52 && endPos >= 0) {
      const globalLandingIndex = (START_INDEX[color] + endPos) % 52;
      const isSafeCell = SAFE_CELLS.includes(globalLandingIndex);

      if (!isSafeCell) {
        const opponentColors = activeColors.filter((c) => c !== color);

        opponentColors.forEach((oppColor) => {
          const oppTokens = [...updatedTokens[oppColor]];
          const oppAnimated = [...updatedAnimated[oppColor]];
          let capturedAny = false;

          oppTokens.forEach((oppPos, oppIdx) => {
            if (oppPos >= 0 && oppPos < 52) {
              const oppGlobalIndex = (START_INDEX[oppColor] + oppPos) % 52;
              if (oppGlobalIndex === globalLandingIndex) {
                // Capture Reset
                oppTokens[oppIdx] = -1;
                oppAnimated[oppIdx] = -1;
                captureOccurred = true;
                capturedAny = true;
              }
            }
          });

          if (capturedAny) {
            updatedTokens[oppColor] = oppTokens;
            updatedAnimated[oppColor] = oppAnimated;
            playCapture();
            setGameMessage(`Captured ${oppColor.toUpperCase()}'s token! Extra turn awarded.`);
          }
        });
      }
    }

    setTokens(updatedTokens);
    setAnimatedTokens(updatedAnimated);

    // Goal Reach check
    let homeReachOccurred = false;
    if (endPos === 56) {
      playHomeReach();
      homeReachOccurred = true;
      setGameMessage(`${color.toUpperCase()} reached home! Extra turn awarded.`);
    }

    // Win Check
    const allHome = playerTokens.every((p) => p === 56);
    let extraTurn = diceRoll === 6 || captureOccurred || homeReachOccurred;

    if (allHome && !rankings.includes(color)) {
      const newRankings = [...rankings, color];
      setRankings(newRankings);
      setGameMessage(`${color.toUpperCase()} finished the game!`);
      extraTurn = false;
    }

    setIsAnimating(false);

    setTimeout(() => {
      advanceTurn(extraTurn);
    }, 800);
  };

  // Coordinates translation helper
  const getTokenCoordinate = (color: LudoColor, tokenIndex: number, pos: number) => {
    if (pos === -1) return BASE_SPOTS[color][tokenIndex];
    if (pos === 56) return GOAL_COORDS[color];
    if (pos >= 52) return HOME_PATH_COORDS[color][pos - 52];
    const globalIdx = (START_INDEX[color] + pos) % 52;
    return TRACK_COORDS[globalIdx];
  };

  // Build coordinate clusters to overlay tokens correctly
  const coordinatesGroups: Record<string, Array<{ color: LudoColor; index: number; validMove: boolean }>> = {};
  activeColors.forEach((color) => {
    animatedTokens[color].forEach((pos, idx) => {
      const coord = getTokenCoordinate(color, idx, pos);
      const key = `${coord.r}-${coord.c}`;
      if (!coordinatesGroups[key]) coordinatesGroups[key] = [];
      const validMove = !isAnimating && hasRolled && color === activeColor && diceRoll !== null && getValidMovesForColor(color, diceRoll).includes(idx);
      coordinatesGroups[key].push({ color, index: idx, validMove });
    });
  });



  return (
    <div className="min-h-[calc(100vh-6rem)] sm:min-h-[calc(100vh-8rem)] flex items-center justify-center p-3 sm:p-4 md:p-6 pt-24">
      <AnimatePresence mode="wait">
        {isLobbyMode ? (
          /* SETUP LOBBY SCREEN */
          <motion.div
            key="lobby"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-md glass rounded-3xl p-6 sm:p-8 text-center border border-white/10 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-16 bg-gradient-to-b from-amber-500/20 to-orange-500/10 blur-2xl pointer-events-none" />
            
            <button
              onClick={() => router.push("/")}
              className="absolute top-4 left-4 h-9 w-9 rounded-full flex items-center justify-center hover:bg-white/5 text-muted-foreground hover:text-foreground active:scale-95 transition-all"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
            </button>

            <Trophy className="h-14 w-14 text-amber-500 mx-auto mb-6 drop-shadow-md" />
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Offline Ludo</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
              Same-device pass and play Ludo. Pick the player count to start.
            </p>

            <div className="space-y-3 mt-8">
              {([2, 3, 4] as const).map((num) => (
                <button
                  key={num}
                  onClick={() => startOfflineGame(num)}
                  className="w-full h-13 rounded-xl border border-border/60 bg-card/40 hover:bg-primary/10 hover:border-primary/40 text-sm font-bold flex items-center justify-between px-6 transition-all duration-300 group"
                >
                  <div className="flex items-center gap-3">
                    <Users className="h-4.5 w-4.5 text-primary group-hover:scale-110 transition-transform" />
                    <span>{num} Players</span>
                  </div>
                  <Play className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors fill-current opacity-30 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          /* ACTIVE GAMEPLAY SCREEN */
          <motion.div
            key="game"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="w-full max-w-5xl flex flex-col lg:flex-row gap-6 items-center justify-center"
          >
            {/* Control Panel */}
            <div className="w-full lg:w-[320px] flex flex-col gap-4">
              <div className="glass rounded-3xl p-5 border border-white/10 flex flex-col gap-4 shadow-xl">
                
                {/* Header Actions */}
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      playClick();
                      if (confirm("Quit match and return to lobby?")) {
                        setIsLobbyMode(true);
                      }
                    }}
                    className="h-8.5 rounded-lg text-xs hover:bg-destructive/10 hover:text-destructive text-muted-foreground gap-1.5"
                  >
                    <LogOut className="h-4 w-4" />
                    Quit
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      playClick();
                      if (confirm("Restart game?")) {
                        startOfflineGame(playerCount || 4);
                      }
                    }}
                    className="h-8.5 rounded-lg text-xs hover:bg-primary/10 text-muted-foreground gap-1.5"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Restart
                  </Button>
                </div>

                {/* Turn Spotlight Indicator */}
                <div className="flex flex-col gap-1 p-3 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Active Turn</span>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        style={{ backgroundColor: COLOR_HEX[activeColor] }}
                        className="h-4.5 w-4.5 rounded-full shadow-lg border border-white/20 animate-ping absolute opacity-75"
                      />
                      <div
                        style={{ backgroundColor: COLOR_HEX[activeColor] }}
                        className="h-4.5 w-4.5 rounded-full shadow-lg border border-white/20 relative"
                      />
                      <span className="text-sm font-black capitalize tracking-wide">{activeColor}</span>
                    </div>
                    {rankings.length > 0 && (
                      <Badge variant="outline" className="text-[9px] border-amber-500/30 text-amber-500 font-bold bg-amber-500/5">
                        {rankings.length} Finished
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Status Message Panel */}
                <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-white/5 text-xs text-center font-bold text-muted-foreground min-h-[50px] flex items-center justify-center leading-relaxed">
                  {gameMessage || "Roll the dice to make your move!"}
                </div>

                {/* Shaking Dice Roller */}
                <div className="flex items-center justify-center gap-4 py-4 bg-neutral-900/40 rounded-2xl border border-white/5 relative overflow-hidden">
                  {renderDiceComponent()}
                  {!hasRolled && !isRollingAnimation && !isAnimating && (
                    <Button onClick={handleRollDice} className="rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-black text-xs px-4">
                      Roll Dice
                    </Button>
                  )}
                  {hasRolled && (
                    <span className="text-[10px] text-primary font-bold animate-pulse">Select Piece</span>
                  )}
                </div>

                {/* Rankings */}
                {rankings.length > 0 && (
                  <div className="space-y-1.5 pt-3 border-t border-white/5">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Rankings</span>
                    <div className="space-y-1">
                      {rankings.map((color, idx) => (
                        <div key={color} className="flex items-center justify-between text-xs bg-white/5 rounded-lg px-3 py-1.5">
                          <span className="font-bold"># {idx + 1}</span>
                          <span className="capitalize font-black" style={{ color: COLOR_HEX[color] }}>{color}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Redesigned Premium Ludo Board */}
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
                        group.length === 1 ? "grid-cols-1" : group.length <= 2 ? "grid-cols-2" : "grid-cols-2 grid-rows-2"
                      )}
                    >
                      {group.map((token: { color: LudoColor; index: number; validMove: boolean }) => {
                        const tokenColorHex = COLOR_HEX[token.color];
                        
                        return (
                          <motion.button
                            key={`${token.color}-${token.index}`}
                            onClick={() => handleTokenClick(token.color, token.index)}
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
                            {/* Inner glossy core decoration */}
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
