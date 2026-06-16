// ============================================================
// Ludo Room Gameplay Page — Authoritative Multiplayer Arena
// ============================================================

"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Share2, Copy, ArrowLeft, RefreshCw, 
  CheckCircle2, LogOut, Mic, MicOff, Volume2, VolumeX, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChatPanel } from "@/components/game/ChatPanel";
import { useOnlineSocket } from "@/hooks/useOnlineSocket";
import { useGameStore } from "@/stores/gameStore";
import { useSound } from "@/hooks/useSound";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import { useSettingsStore } from "@/stores/settingsStore";
import { cn } from "@/lib/utils";
import type { LudoColor } from "@/lib/game/types";

// Ludo Constants & Coordinates Map
const LUDO_COLORS: LudoColor[] = ["red", "green", "yellow", "blue"];

const COLOR_HEX = {
  red: "#EF4444",
  green: "#10B981",
  yellow: "#F59E0B",
  blue: "#3B82F6"
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

// Helper to fetch grid coordinates of a token
const getTokenGridCell = (color: LudoColor, tokenIdx: number, stepPos: number) => {
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

export default function LudoRoomPage() {
  const router = useRouter();
  const { roomId } = useParams() as { roomId: string };
  const { playClick, playDiceRoll, playTokenMove, playCapture, playHomeReach } = useSound();

  const {
    connect,
    rejoinRoom,
    sendLudoReadyState,
    sendLudoStartGame,
    sendLudoRollDice,
    sendLudoMoveToken,
    sendRematchRequest,
    leaveRoom,
    socket
  } = useOnlineSocket();

  const onlineRoom = useGameStore((s) => s.onlineRoom);
  const onlinePlayerId = useGameStore((s) => s.onlinePlayerId);
  const onlinePlayerSymbol = useGameStore((s) => s.onlinePlayerSymbol) as LudoColor | null;
  const ludoState = useGameStore((s) => s.ludoState);
  const chatHistory = useGameStore((s) => s.chatHistory);

  const voiceSpeakerEnabled = useSettingsStore((s) => s.voiceSpeakerEnabled);
  const toggleVoiceSpeaker = useSettingsStore((s) => s.toggleVoiceSpeaker);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [tempDiceRoll, setTempDiceRoll] = useState<number | null>(null);
  const prevChatLengthRef = useRef(chatHistory.length);

  useEffect(() => {
    if (isChatOpen) {
      const timer = setTimeout(() => setUnreadChatCount(0), 0);
      return () => clearTimeout(timer);
    } else {
      const diff = chatHistory.length - prevChatLengthRef.current;
      if (diff > 0) {
        setUnreadChatCount((c) => c + diff);
      }
    }
    prevChatLengthRef.current = chatHistory.length;
  }, [chatHistory, isChatOpen]);

  // Dice value cycling during roll
  useEffect(() => {
    if (!isRolling) return;
    const interval = setInterval(() => {
      setTempDiceRoll(Math.floor(Math.random() * 6) + 1);
    }, 60);
    return () => {
      clearInterval(interval);
      setTempDiceRoll(null);
    };
  }, [isRolling]);

  const [animatedTokens, setAnimatedTokens] = useState<Record<string, number[]>>({
    red: [-1, -1, -1, -1],
    green: [-1, -1, -1, -1],
    yellow: [-1, -1, -1, -1],
    blue: [-1, -1, -1, -1],
  });
  const [isAnimating, setIsAnimating] = useState(false);

  const prevDiceRoll = useRef<number | null>(null);
  const prevTokens = useRef<Record<string, number[]> | null>(null);

  // Reconnect on mount
  useEffect(() => {
    connect();
    rejoinRoom(roomId);
  }, [connect, rejoinRoom, roomId]);

  // Voice setup
  const {
    micActive,
    speakingPlayers,
    mutedPlayers,
    connectionStatuses,
    permissionDenied,
    toggleMic
  } = useVoiceChat({
    socket,
    roomId,
    playerId: onlinePlayerId || "",
    players: onlineRoom?.players || []
  });

  // Roll Dice sound listener
  useEffect(() => {
    if (!ludoState) return;

    if (ludoState.diceRoll !== null && ludoState.diceRoll !== prevDiceRoll.current) {
      playDiceRoll();
      setIsRolling(true);
      const timer = setTimeout(() => setIsRolling(false), 700);
      return () => clearTimeout(timer);
    }
    prevDiceRoll.current = ludoState.diceRoll;
  }, [ludoState, playDiceRoll]);

  // Cell-by-cell Token path synchronizer and delayed captures
  useEffect(() => {
    if (!ludoState?.tokens) return;

    if (!prevTokens.current) {
      setAnimatedTokens(ludoState.tokens);
      prevTokens.current = JSON.parse(JSON.stringify(ludoState.tokens));
      return;
    }

    const moves: { color: LudoColor; index: number; prevPos: number; serverPos: number }[] = [];
    const captures: { color: LudoColor; index: number; prevPos: number }[] = [];

    Object.keys(ludoState.tokens).forEach((colorStr) => {
      const color = colorStr as LudoColor;
      const serverPosArray = ludoState.tokens[color] || [];
      const prevPosArray = prevTokens.current?.[color] || [];

      serverPosArray.forEach((serverPos, idx) => {
        const prevPos = prevPosArray[idx];
        if (serverPos !== prevPos) {
          if (serverPos === -1) {
            captures.push({ color, index: idx, prevPos });
          } else {
            moves.push({ color, index: idx, prevPos, serverPos });
          }
        }
      });
    });

    if (moves.length === 0) {
      // Just apply captures instantly if they happen on their own
      captures.forEach((cap) => {
        setAnimatedTokens((prev) => {
          const updated = { ...prev };
          updated[cap.color] = [...updated[cap.color]];
          updated[cap.color][cap.index] = -1;
          return updated;
        });
        playCapture();
      });
    } else {
      // Animate moves, and resolve captures only when the capturing token lands
      moves.forEach((move) => {
        setIsAnimating(true);
        const current = move.prevPos === -1 ? -1 : move.prevPos;
        const steps: number[] = [];

        if (current === -1) {
          steps.push(0);
        } else {
          for (let p = current + 1; p <= move.serverPos; p++) {
            steps.push(p);
          }
        }

        let stepIdx = 0;
        const runOnlineStep = () => {
          if (stepIdx < steps.length) {
            const nextPos = steps[stepIdx];
            playTokenMove();
            setAnimatedTokens((prev) => {
              const updated = { ...prev };
              updated[move.color] = [...updated[move.color]];
              updated[move.color][move.index] = nextPos;
              return updated;
            });
            stepIdx++;
            setTimeout(runOnlineStep, 180);
          } else {
            setIsAnimating(false);
            if (move.serverPos === 56) playHomeReach();

            // Check if this move landed on a cell where opponent was captured
            const landingCoords = getTokenGridCell(move.color, move.index, move.serverPos);
            
            captures.forEach((cap) => {
              const capCoords = getTokenGridCell(cap.color, cap.index, cap.prevPos);
              if (landingCoords && capCoords && landingCoords.r === capCoords.r && landingCoords.c === capCoords.c) {
                setAnimatedTokens((prev) => {
                  const updated = { ...prev };
                  updated[cap.color] = [...updated[cap.color]];
                  updated[cap.color][cap.index] = -1;
                  return updated;
                });
                playCapture();
              }
            });

            // Safeguard to clear any remaining captures in this state tick
            captures.forEach((cap) => {
              setAnimatedTokens((prev) => {
                if (prev[cap.color][cap.index] !== -1) {
                  const updated = { ...prev };
                  updated[cap.color] = [...updated[cap.color]];
                  updated[cap.color][cap.index] = -1;
                  return updated;
                }
                return prev;
              });
            });
          }
        };
        runOnlineStep();
      });
    }

    prevTokens.current = JSON.parse(JSON.stringify(ludoState.tokens));
  }, [ludoState, playCapture, playHomeReach, playTokenMove]);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    playClick();
    if (navigator.share) {
      navigator.share({
        title: "Join my Ludo Arena!",
        text: `Room Code: ${roomId}`,
        url: window.location.href
      }).catch(() => {});
    } else {
      copyRoomCode();
    }
  };



  // Helper to group active tokens by coordinates for overlapping offset styling
  const groupTokensByCoordinate = () => {
    if (!ludoState) return {};

    const coordinatesMap: Record<string, { color: LudoColor; index: number; validMove: boolean }[]> = {};

    LUDO_COLORS.forEach((color) => {
      const tokensList = animatedTokens[color] || [];
      const validMoves = getValidTokenMoves(color);

      tokensList.forEach((pos, tokenIdx) => {
        const gridCell = getTokenGridCell(color, tokenIdx, pos);
        const coordKey = `${gridCell.r}-${gridCell.c}`;

        if (!coordinatesMap[coordKey]) {
          coordinatesMap[coordKey] = [];
        }
        coordinatesMap[coordKey].push({
          color,
          index: tokenIdx,
          validMove: !isAnimating && validMoves.includes(tokenIdx)
        });
      });
    });

    return coordinatesMap;
  };

  const getValidTokenMoves = (color: LudoColor) => {
    if (!ludoState || !onlineRoom || onlineRoom.currentPlayer !== color || !ludoState.hasRolled || ludoState.diceRoll === null) {
      return [];
    }
    const valid = [];
    const roll = ludoState.diceRoll;
    const tokens = ludoState.tokens[color];
    for (let i = 0; i < 4; i++) {
      const pos = tokens[i];
      if (pos === -1) {
        if (roll === 6) valid.push(i);
      } else if (pos < 56) {
        if (pos + roll <= 56) {
          valid.push(i);
        }
      }
    }
    return valid;
  };

  // Turn management helpers
  const isMyTurn = onlineRoom?.currentPlayer === onlinePlayerSymbol && ludoState?.isGameStarted;
  const isHost = onlineRoom?.players.find((p) => p.playerId === onlinePlayerId)?.isHost || false;

  const handleRollClick = () => {
    if (!isMyTurn || ludoState?.hasRolled) return;
    playClick();
    if (sendLudoRollDice) sendLudoRollDice();
  };

  const handleTokenClick = (color: LudoColor, tokenIndex: number) => {
    if (color !== onlinePlayerSymbol || !isMyTurn || !ludoState?.hasRolled) return;
    const valid = getValidTokenMoves(color);
    if (!valid.includes(tokenIndex)) return;

    playClick();
    if (sendLudoMoveToken) sendLudoMoveToken(tokenIndex);
  };

  if (!onlineRoom || !ludoState) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <RefreshCw className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-semibold text-muted-foreground">Reconnecting to Ludo Arena...</p>
      </div>
    );
  }

  const renderDiceComponent = (isCompact = false) => {
    const activeColor = ludoState.currentPlayerIndex !== undefined ? LUDO_COLORS[ludoState.currentPlayerIndex] : "red";
    const activeHex = COLOR_HEX[activeColor];
    const diceVal = tempDiceRoll !== null ? tempDiceRoll : ludoState.diceRoll;

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
      if (!isMyTurn || ludoState.hasRolled || isRolling || isAnimating) return;
      handleRollClick();
    };

    const diceSizeClass = isCompact ? "h-9 w-9 border" : "h-16 w-16 border-2";
    const gapClass = isCompact ? "gap-0.5 w-5 h-5" : "grid-cols-3 grid-rows-3 gap-1.5 w-8 h-8 p-0.5";

    return (
      <div 
        style={{ perspective: "1000px" }}
        className="flex items-center justify-center shrink-0"
      >
        <motion.div
          onClick={handleRoll}
          animate={
            isRolling
              ? {
                  rotateX: [0, 180, 360, 540, 720],
                  rotateY: [0, 90, 270, 450, 720],
                  rotateZ: [0, 180, 360, 540, 720],
                  scale: [1, 1.25, 0.85, 1.15, 1],
                  z: [0, 50, -30, 20, 0]
                }
              : isMyTurn && !ludoState.hasRolled
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
            isRolling
              ? { duration: 0.7, ease: "easeInOut" }
              : isMyTurn && !ludoState.hasRolled
                ? { repeat: Infinity, duration: 1.2, ease: "easeInOut" }
                : {}
          }
          style={{
            borderBottomWidth: isCompact ? "2px" : "4px",
            borderBottomColor: activeHex,
            filter: isRolling ? "blur(1.2px)" : "none",
            transformStyle: "preserve-3d"
          }}
          className={cn(
            "rounded-xl bg-white border-slate-300 flex items-center justify-center shadow-lg select-none transition-all",
            isMyTurn && !ludoState.hasRolled && !isRolling && !isAnimating
              ? "cursor-pointer border-primary animate-bounce"
              : "text-foreground cursor-default",
            diceSizeClass
          )}
        >
          {diceVal === null ? (
            <div className={cn("font-extrabold text-muted-foreground/60 select-none", isCompact ? "text-[10px]" : "text-xl")}>?</div>
          ) : (
            <div className={cn("grid grid-cols-3 grid-rows-3", gapClass)}>
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-full transition-all duration-200 bg-slate-900",
                    activeDots.includes(i) ? "opacity-100 scale-100" : "opacity-0 scale-50"
                  )}
                  style={{ width: isCompact ? "4px" : "6px", height: isCompact ? "4px" : "6px" }}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    );
  };

  const coordinatesGroups = groupTokensByCoordinate();

  return (
    <div className="relative min-h-[calc(100vh-6rem)] sm:min-h-[calc(100vh-8rem)] flex flex-col items-center py-4 px-2 select-none">
            {/* Header Panel */}
      <div className="w-full max-w-[95vw] sm:max-w-md lg:max-w-[1000px] flex items-center justify-between mb-4 border border-border/40 p-2.5 rounded-2xl glass">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              playClick();
              if (confirm("Are you sure you want to leave the room?")) {
                leaveRoom();
                router.push("/online");
              }
            }}
            variant="ghost"
            size="icon"
            className="w-10 h-10 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
              {onlineRoom.status === "playing" ? "Ludo Arena Match" : "Lobby Room"}
            </span>
            <span className="text-sm font-extrabold font-mono tracking-widest">{roomId}</span>
          </div>
        </div>

        {/* Header Action controls (Lobby-only to avoid duplicate layout clutter) */}
        {onlineRoom.status !== "playing" && (
          <div className="flex items-center gap-1.5">
            {/* Speaker Button */}
            <Button
              onClick={() => {
                playClick();
                toggleVoiceSpeaker();
              }}
              variant="outline"
              size="icon"
              className="w-10 h-10 rounded-xl border-border/50 hover:bg-accent transition-all shrink-0"
              aria-label="Toggle voice output"
            >
              {voiceSpeakerEnabled ? <Volume2 className="h-4.5 w-4.5 text-primary" /> : <VolumeX className="h-4.5 w-4.5 text-muted-foreground" />}
            </Button>

            {/* Mic Button */}
            <Button
              onClick={() => {
                playClick();
                toggleMic();
              }}
              variant="outline"
              size="icon"
              className={cn(
                "w-10 h-10 rounded-xl border-border/50 transition-all shrink-0",
                micActive ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/15" : "hover:bg-accent"
              )}
              aria-label="Toggle microphone"
            >
              {micActive ? <Mic className="h-4.5 w-4.5" /> : <MicOff className="h-4.5 w-4.5 text-muted-foreground" />}
            </Button>

            {/* Chat Panel Trigger */}
            <Button
              onClick={() => {
                playClick();
                setIsChatOpen(!isChatOpen);
              }}
              variant="outline"
              size="icon"
              className="w-10 h-10 rounded-xl border-border/50 hover:bg-accent transition-all shrink-0 relative"
            >
              <MessageSquare className="h-4.5 w-4.5 text-primary" />
              {unreadChatCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
                  {unreadChatCount}
                </span>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* NEW PREMIUM TOP HUD (visible during active play) */}
      {onlineRoom.status === "playing" && (
        <div className="w-full max-w-[95vw] lg:max-w-[1000px] mb-4 bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-3xl p-3 sm:p-4 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 select-none">
          {/* Left: Player Avatars & Connection States */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {onlineRoom.players.map((p) => {
              const color = p.symbol as LudoColor;
              const isCurrent = onlineRoom.currentPlayer === color;
              const isSpeaking = speakingPlayers[p.playerId] || false;
              const isMuted = mutedPlayers[p.playerId] || false;
              const conn = connectionStatuses[p.playerId] || "new";

              return (
                <div
                  key={p.playerId}
                  className={cn(
                    "flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all shrink-0",
                    isCurrent 
                      ? "bg-white/10 border-white/20 shadow-md shadow-white/5 animate-pulse"
                      : "border-transparent bg-slate-950/40"
                  )}
                >
                  {/* Avatar Bubble */}
                  <div className="relative">
                    <div 
                      className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center font-bold border-2 text-white shadow-sm text-xs",
                        isSpeaking && "animate-bounce"
                      )}
                      style={{ 
                        borderColor: COLOR_HEX[color],
                        backgroundColor: `${COLOR_HEX[color]}33` // 20% opacity background
                      }}
                    >
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    
                    {/* Speaker overlay */}
                    {isSpeaking && (
                      <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-100 animate-ping" />
                      </span>
                    )}

                    {/* Mute indicator overlay */}
                    {isMuted && !isSpeaking && (
                      <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-red-500 border border-slate-900 flex items-center justify-center">
                        <MicOff className="h-2 w-2 text-white" />
                      </span>
                    )}
                  </div>

                  {/* Player Name and Connection Status */}
                  <div className="flex flex-col">
                    <span className="text-xs font-extrabold truncate max-w-[65px] sm:max-w-[90px]">{p.name}</span>
                    <span className={cn(
                      "text-[8px] font-black uppercase tracking-wider",
                      !p.isConnected 
                        ? "text-red-500" 
                        : conn === "connected"
                          ? "text-emerald-500"
                          : "text-amber-500"
                    )}>
                      {!p.isConnected ? "Offline" : conn}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Center: Turn Tracker Banner */}
          <div className="flex items-center justify-center flex-1 py-1 md:py-0 border-y md:border-y-0 md:border-x border-white/5 px-4 gap-2.5">
            <div
              className="h-4.5 w-4.5 rounded-full border border-black/10 shrink-0 shadow-sm animate-pulse"
              style={{ backgroundColor: COLOR_HEX[onlineRoom.currentPlayer as LudoColor] }}
            />
            <div className="flex flex-col text-center md:text-left min-w-0">
              <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest leading-none block mb-0.5">Active Turn</span>
              <span className="text-xs sm:text-sm font-black truncate max-w-[150px]">
                {onlineRoom.players.find((p) => p.symbol === onlineRoom.currentPlayer)?.name || onlineRoom.currentPlayer}
              </span>
            </div>
            {isMyTurn && (
              <Badge variant="outline" className="bg-primary/15 border-primary/20 text-primary uppercase font-extrabold text-[9px] tracking-wide animate-pulse shrink-0">
                Your Turn
              </Badge>
            )}
          </div>

          {/* Right: Audio Control Actions */}
          <div className="flex items-center justify-end gap-1.5 shrink-0">
            <Button
              onClick={() => {
                playClick();
                toggleVoiceSpeaker();
              }}
              variant="outline"
              size="icon"
              className={cn(
                "w-9 h-9 sm:w-10 sm:h-10 rounded-xl border-border/40 transition-all shrink-0",
                voiceSpeakerEnabled ? "bg-sky-500/10 text-sky-400 border-sky-500/25 hover:bg-sky-500/15" : "hover:bg-accent"
              )}
              aria-label="Toggle voice output"
            >
              {voiceSpeakerEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
            </Button>

            <Button
              onClick={() => {
                playClick();
                toggleMic();
              }}
              variant="outline"
              size="icon"
              className={cn(
                "w-9 h-9 sm:w-10 sm:h-10 rounded-xl border-border/40 transition-all shrink-0",
                micActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/15 animate-pulse" : "hover:bg-accent"
              )}
              aria-label="Toggle microphone"
            >
              {micActive ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4 text-muted-foreground" />}
            </Button>

            <Button
              onClick={() => {
                playClick();
                setIsChatOpen(!isChatOpen);
              }}
              variant="outline"
              size="icon"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border-border/40 hover:bg-accent transition-all shrink-0 relative"
            >
              <MessageSquare className="h-4 w-4 text-primary" />
              {unreadChatCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white animate-pulse">
                  {unreadChatCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Microphone Blocked Notice */}
      {permissionDenied && (
        <div className="w-full max-w-[95vw] sm:max-w-md lg:max-w-[1000px] mb-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl p-3 text-xs font-bold text-center shadow-lg">
          ⚠️ Microphone blocked. Please allow mic access in your browser settings to use voice chat.
        </div>
      )}

      {/* LOBBY WAITING SCREEN */}
      {onlineRoom.status === "waiting" && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[95vw] sm:max-w-md space-y-6"
        >
          {/* Invite Code Panel */}
          <div className="glass rounded-2xl p-5 border border-border/40 text-center space-y-3">
            <h2 className="text-lg font-bold">Waiting for Players</h2>
            <p className="text-xs text-muted-foreground">Invite friends by sharing this room code</p>
            <div className="flex items-center justify-center gap-2 bg-muted/50 border border-border/40 px-4 py-3 rounded-xl">
              <span className="font-mono text-xl font-extrabold tracking-widest text-primary">{roomId}</span>
              <div className="flex gap-1 ml-2">
                <Button variant="ghost" size="icon" onClick={copyRoomCode} className="h-9 w-9 rounded-lg hover:bg-accent shrink-0">
                  {copied ? <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" /> : <Copy className="h-4.5 w-4.5" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={handleShare} className="h-9 w-9 rounded-lg hover:bg-accent shrink-0">
                  <Share2 className="h-4.5 w-4.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Player Slots */}
          <div className="space-y-3">
            {LUDO_COLORS.slice(0, onlineRoom.maxPlayers).map((color) => {
              const player = onlineRoom.players.find((p) => p.symbol === color);

              return (
                <div
                  key={color}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border backdrop-blur-sm select-none",
                    player ? "glass border-primary/20 bg-primary/5" : "bg-card/35 border-border/30 border-dashed"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {/* Color Slot Dot */}
                    <div
                      className="h-7 w-7 rounded-lg shadow-sm border border-black/10 shrink-0"
                      style={{ backgroundColor: COLOR_HEX[color] }}
                    />
                    <div>
                      <span className="text-sm font-extrabold leading-none block">
                        {player ? player.name : "Searching slot..."}
                      </span>
                      {player && (
                        <span className="text-[10px] text-muted-foreground/80 font-bold uppercase block mt-0.5">
                          {player.isHost ? "Host Slot" : "Player Slot"}
                        </span>
                      )}
                    </div>
                  </div>

                  {player ? (
                    <div className="flex items-center gap-2">
                      {/* Speaker Indicator */}
                      {speakingPlayers[player.playerId] && (
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                      )}
                      
                      {/* Ready Badge */}
                      <Badge
                        className={cn(
                          "px-2.5 py-0.5 font-extrabold text-[10px] shadow-sm tracking-wide uppercase",
                          player.isReady
                            ? "bg-emerald-600/10 border border-emerald-500/35 text-emerald-500 hover:bg-emerald-600/15"
                            : "bg-red-500/10 border border-red-500/35 text-red-500 hover:bg-red-500/15"
                        )}
                      >
                        {player.isReady ? "Ready" : "Waiting"}
                      </Badge>
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-muted-foreground/50 uppercase">Empty</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Ready & Start Action controls */}
          <div className="pt-2">
            {isHost ? (
              <Button
                onClick={() => {
                  playClick();
                  sendLudoStartGame();
                }}
                disabled={
                  onlineRoom.players.length < 2 ||
                  !onlineRoom.players.every((p) => p.isReady)
                }
                className="w-full h-13 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-extrabold text-base shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2"
              >
                Start Ludo Arena Match
              </Button>
            ) : (
              <Button
                onClick={() => {
                  playClick();
                  const me = onlineRoom.players.find((p) => p.playerId === onlinePlayerId);
                  sendLudoReadyState(!me?.isReady);
                }}
                className={cn(
                  "w-full h-13 rounded-xl font-extrabold text-base shadow-md transition-all flex items-center justify-center gap-2",
                  onlineRoom.players.find((p) => p.playerId === onlinePlayerId)?.isReady
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/10"
                    : "bg-primary hover:bg-primary/95 text-primary-foreground shadow-primary/10"
                )}
              >
                {onlineRoom.players.find((p) => p.playerId === onlinePlayerId)?.isReady ? "Cancel Ready Check" : "Ready to Play"}
              </Button>
            )}
          </div>
        </motion.div>
      )}

      {/* LUDO ACTIVE GAME SCREEN */}
      {onlineRoom.status === "playing" && (
        <div className="w-full max-w-[95vw] lg:max-w-[1000px] grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Left Area: Turn Info, Players Dashboard */}
          <div className="lg:col-span-4 space-y-4 order-2 lg:order-1 select-none">
            
            {/* Round Turn Tracker Banner */}
            <div className="hidden lg:flex glass border border-border/40 p-4 rounded-2xl items-center justify-between shadow-sm">
              <div className="flex items-center gap-2.5">
                <div
                  className="h-5 w-5 rounded-full border border-black/10 shrink-0 shadow-sm animate-pulse"
                  style={{ backgroundColor: COLOR_HEX[onlineRoom.currentPlayer as LudoColor] }}
                />
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Active Turn</span>
                  <span className="text-sm font-extrabold">
                    {onlineRoom.players.find((p) => p.symbol === onlineRoom.currentPlayer)?.name || onlineRoom.currentPlayer}
                  </span>
                </div>
              </div>

              {isMyTurn && (
                <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary uppercase font-extrabold text-[10px] tracking-wide animate-pulse">
                  Your Turn
                </Badge>
              )}
            </div>

            {/* Players Status List */}
            <div className="glass border border-border/40 p-4 rounded-2xl space-y-3.5 shadow-sm">
              <span className="text-[10px] text-muted-foreground uppercase font-extrabold tracking-wider block mb-1">Players Status</span>
              {onlineRoom.players.map((p) => {
                const color = p.symbol as LudoColor;
                const isCurrent = onlineRoom.currentPlayer === color;

                return (
                  <div
                    key={p.playerId}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-xl border transition-all select-none",
                      isCurrent ? "bg-primary/5 border-primary/20" : "border-transparent bg-muted/20"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-4.5 w-4.5 rounded-lg border border-black/5" style={{ backgroundColor: COLOR_HEX[color] }} />
                      <span className="text-xs font-bold truncate max-w-[85px] sm:max-w-[120px]">
                        {p.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {/* Connection status indicator */}
                      {!p.isConnected ? (
                        <Badge variant="outline" className="bg-red-500/10 border-red-500/20 text-red-500 text-[9px] px-1 font-bold">Offline</Badge>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/20" />
                          {connectionStatuses[p.playerId] && (
                            <span className={cn(
                              "text-[8px] font-bold uppercase tracking-wide",
                              connectionStatuses[p.playerId] === "connected"
                                ? "text-emerald-500"
                                : ["connecting", "checking", "new"].includes(connectionStatuses[p.playerId])
                                  ? "text-amber-500 animate-pulse"
                                  : "text-red-500"
                            )}>
                              {connectionStatuses[p.playerId]}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Speaking state */}
                      {speakingPlayers[p.playerId] && (
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                      )}

                      {/* Mic status indicator */}
                      {mutedPlayers[p.playerId] ? <MicOff className="h-3.5 w-3.5 text-muted-foreground/60" /> : <Mic className="h-3.5 w-3.5 text-primary" />}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Dice Control Container */}
            <div className="hidden lg:flex glass border border-border/40 p-5 rounded-2xl flex-col items-center justify-center gap-4 shadow-md text-center">
              <span className="text-[10px] text-muted-foreground uppercase font-extrabold tracking-wider block">Dice Action Roller</span>
              {renderDiceComponent(false)}
              {isMyTurn && !ludoState.hasRolled && (
                <Button onClick={handleRollClick} className="w-full h-11 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-extrabold text-xs shadow-md">
                  Roll Dice Piece
                </Button>
              )}
              {isMyTurn && ludoState.hasRolled && (
                <p className="text-xs text-primary font-extrabold animate-pulse">Select a glowing piece to move</p>
              )}
            </div>
          </div>

          {/* Right/Middle Area: Responsive 15x15 Ludo Board Grid */}
          <div className="lg:col-span-8 flex flex-col items-center justify-center order-1 lg:order-2">
            
            {/* Top Area: Turn Info, Compact Dice (Mobile Only) */}
            <div className="w-full space-y-3 lg:hidden mb-3 select-none">
              <div className="flex gap-2 w-full">
                {/* Turn Tracker Banner */}
                <div className="flex-1 glass border border-border/40 p-2.5 rounded-xl flex items-center gap-2.5 shadow-sm">
                  <div
                    className="h-4 w-4 rounded-full border border-black/10 shrink-0 shadow-sm animate-pulse"
                    style={{ backgroundColor: COLOR_HEX[onlineRoom.currentPlayer as LudoColor] }}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[8px] text-muted-foreground uppercase font-bold tracking-wider">Active Turn</span>
                    <span className="text-xs font-extrabold truncate max-w-[95px]">
                      {onlineRoom.players.find((p) => p.symbol === onlineRoom.currentPlayer)?.name || onlineRoom.currentPlayer}
                    </span>
                  </div>
                  {isMyTurn && (
                    <Badge variant="outline" className="ml-auto bg-primary/10 border-primary/20 text-primary uppercase font-extrabold text-[8px] tracking-wide animate-pulse py-0 h-4 px-1">
                      You
                    </Badge>
                  )}
                </div>

                {/* Compact Dice Roller */}
                <div className="flex-1 glass border border-border/40 p-2 rounded-xl flex items-center justify-between gap-2 shadow-sm px-3">
                  <span className="text-[8px] text-muted-foreground uppercase font-bold tracking-wider">Dice</span>
                  {renderDiceComponent(true)}
                  {isMyTurn && !ludoState.hasRolled && (
                    <Button onClick={handleRollClick} size="sm" className="h-8 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-extrabold text-[10px] px-2.5 shrink-0">
                      Roll
                    </Button>
                  )}
                  {isMyTurn && ludoState.hasRolled && (
                    <span className="text-[8px] text-primary font-bold animate-pulse">Select Piece</span>
                  )}
                </div>
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

                    // Home Yards Redesign
                    if (rIdx < 6 && cIdx < 6) cellColor = "bg-red-950/20";
                    else if (rIdx < 6 && cIdx > 8) cellColor = "bg-emerald-950/20";
                    else if (rIdx > 8 && cIdx > 8) cellColor = "bg-amber-950/20";
                    else if (rIdx > 8 && cIdx < 6) cellColor = "bg-blue-950/20";

                    // Home Paths Redesign
                    if (rIdx === 7 && cIdx >= 1 && cIdx <= 5) cellColor = "bg-gradient-to-r from-red-600/60 to-red-500/95";
                    else if (cIdx === 7 && rIdx >= 1 && rIdx <= 5) cellColor = "bg-gradient-to-b from-emerald-600/60 to-emerald-500/95";
                    else if (rIdx === 7 && cIdx >= 9 && cIdx <= 13) cellColor = "bg-gradient-to-l from-amber-600/60 to-amber-500/95";
                    else if (cIdx === 7 && rIdx >= 9 && rIdx <= 13) cellColor = "bg-gradient-to-t from-blue-600/60 to-blue-500/95";

                    // Center goal Paths Redesign
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
                        {isSafeCell && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-40 select-none text-yellow-400 font-extrabold text-sm scale-110">
                            ★
                          </div>
                        )}
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
          </div>

        </div>
      )}

      {/* FINISHED GAME OVER RANKINGS OVERLAY */}
      {onlineRoom.status === "finished" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm glass border border-border/40 p-6 rounded-3xl text-center space-y-5 shadow-2xl relative select-none"
          >
            <h2 className="text-2xl font-black tracking-tight">Match Rankings</h2>
            <p className="text-xs text-muted-foreground">The battle has completed. Ranks achieved:</p>

            <div className="space-y-3">
              {(ludoState.rankings || []).map((color, index) => {
                const p = onlineRoom.players.find((player) => player.symbol === color);

                return (
                  <div
                    key={color}
                    className={cn(
                      "flex items-center justify-between p-3 border rounded-xl",
                      index === 0 ? "bg-amber-500/10 border-amber-500/35" : "glass border-border/40 bg-muted/10"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-extrabold font-mono text-muted-foreground w-4">{index + 1}.</span>
                      <div className="h-4 w-4 rounded-lg" style={{ backgroundColor: COLOR_HEX[color] }} />
                      <span className="text-sm font-extrabold truncate max-w-[120px]">
                        {p ? p.name : color.toUpperCase()}
                      </span>
                    </div>
                    {index === 0 && <span className="text-[10px] uppercase font-bold text-amber-500">Winner</span>}
                  </div>
                );
              })}
            </div>

            {/* Rematch actions */}
            <div className="pt-2 space-y-2">
              <Button
                onClick={() => {
                  playClick();
                  sendRematchRequest();
                }}
                className={cn(
                  "w-full h-12 rounded-xl font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2",
                  onlineRoom.rematchRequests.includes(onlinePlayerId || "")
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/10 animate-pulse"
                    : "bg-primary hover:bg-primary/95 text-primary-foreground shadow-primary/10"
                )}
              >
                {onlineRoom.rematchRequests.includes(onlinePlayerId || "")
                  ? `Voted Rematch (${onlineRoom.rematchRequests.length}/${onlineRoom.players.length})`
                  : "Request Rematch"}
              </Button>

              <Button
                onClick={() => {
                  playClick();
                  if (confirm("Return to Lobby?")) {
                    leaveRoom();
                    router.push("/online");
                  }
                }}
                variant="ghost"
                className="w-full h-11 rounded-xl text-xs hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all"
              >
                <LogOut className="h-4 w-4 mr-1.5" />
                Return to Lobby
              </Button>
            </div>

          </motion.div>
        </div>
      )}

      {/* RENDER CHAT PANEL SLIDE DRAWER */}
      <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

    </div>
  );
}
