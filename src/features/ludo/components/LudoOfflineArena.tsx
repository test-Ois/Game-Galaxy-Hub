// ============================================================
// LudoOfflineArena Component — Local Pass & Play Ludo
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RefreshCw, LogOut, Play, Users, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { useSound } from "@/shared/hooks/useSound";
import { cn } from "@/shared/services/utils";
import type { LudoColor } from "@/shared/types/game";

import { LudoBoard } from "./LudoBoard";
import { LudoDice } from "./LudoDice";
import { LudoTokens } from "./LudoTokens";
import { COLOR_HEX, BASE_SPOTS, SAFE_CELLS, TRACK_COORDS, START_INDEX, HOME_PATH_COORDS, GOAL_COORDS, getTokenCoordinate } from "../constants/coordinates";

const COLOR_MAPPING_BY_COUNT = {
  2: ["red", "yellow"] as LudoColor[],
  3: ["red", "green", "yellow"] as LudoColor[],
  4: ["red", "green", "yellow", "blue"] as LudoColor[],
};

export function LudoOfflineArena() {
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
                  <LudoDice
                    activeColor={activeColor}
                    diceRoll={diceRoll}
                    tempDiceRoll={tempDiceRoll}
                    hasRolled={hasRolled}
                    isRolling={isRollingAnimation}
                    isAnimating={isAnimating}
                    isMyTurn={true}
                    onRoll={handleRollDice}
                  />
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

            {/* Premium Ludo Board */}
            <LudoBoard>
              <LudoTokens
                coordinatesGroups={coordinatesGroups}
                onTokenClick={handleTokenClick}
              />
            </LudoBoard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
