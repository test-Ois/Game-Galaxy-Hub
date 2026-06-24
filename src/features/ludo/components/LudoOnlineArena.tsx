// ============================================================
// LudoOnlineArena Component — Online Multiplayer Ludo Orchestrator
// ============================================================

"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Copy, ArrowLeft, RefreshCw, CheckCircle2, LogOut, MicOff } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { useOnlineSocket } from "@/features/multiplayer";
import { useGameStore } from "@/store/gameStore";
import { useSound } from "@/shared/hooks/useSound";
import { cn } from "@/shared/services/utils";
import type { LudoColor } from "@/shared/types/game";

import { LudoBoard } from "./LudoBoard";
import { LudoDice } from "./LudoDice";
import { LudoTokens } from "./LudoTokens";
import { LudoChatPanel } from "./LudoChatPanel";
import { LudoVoicePanel } from "./LudoVoicePanel";
import { COLOR_HEX, LUDO_COLORS, getTokenGridCell } from "../constants/coordinates";

interface LudoOnlineArenaProps {
  roomId: string;
  chatPanel?: React.ReactNode;
  
  // Voice state ports
  micActive: boolean;
  speakingPlayers: Record<string, boolean>;
  mutedPlayers: Record<string, boolean>;
  connectionStatuses: Record<string, string>;
  permissionDenied: boolean;
  onToggleMic: () => void;

  // Settings / speaker ports
  voiceSpeakerEnabled: boolean;
  onToggleSpeaker: () => void;
}

export function LudoOnlineArena({
  roomId,
  chatPanel,
  micActive,
  speakingPlayers,
  mutedPlayers,
  connectionStatuses,
  permissionDenied,
  onToggleMic,
  voiceSpeakerEnabled,
  onToggleSpeaker,
}: LudoOnlineArenaProps) {
  const router = useRouter();
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

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
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

  const isMyTurn = !!(onlineRoom && ludoState && onlineRoom.currentPlayer === onlinePlayerSymbol && ludoState.isGameStarted);
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

  const coordinatesGroups = groupTokensByCoordinate();

  return (
    <div className="relative min-h-[calc(100vh-6rem)] sm:min-h-[calc(100vh-8rem)] flex flex-col items-center py-4 px-2 select-none">
      
      {/* Header Panel */}
      <div className="w-full max-w-[95vw] sm:max-w-md lg:max-w-[1000px] flex items-center justify-between mb-4 border border-border/40 p-2.5 rounded-2xl glass">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              playClick();
              setShowExitConfirm(true);
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

        {/* Header Action controls (LudoVoicePanel & LudoChatPanel) */}
        <div className="flex items-center gap-1.5">
          <LudoVoicePanel
            micActive={micActive}
            voiceSpeakerEnabled={voiceSpeakerEnabled}
            permissionDenied={permissionDenied}
            onToggleMic={onToggleMic}
            onToggleSpeaker={onToggleSpeaker}
            isCompact={true}
          />
          <LudoChatPanel
            unreadChatCount={unreadChatCount}
            onToggleChat={() => setIsChatOpen(!isChatOpen)}
          />
        </div>
      </div>

      {/* TOP HUD */}
      {onlineRoom.status === "playing" && (
        <div className="w-full max-w-[95vw] lg:max-w-[1000px] mb-4 bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-3xl p-3 sm:p-4 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
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
                  <div className="relative">
                    <div 
                      className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center font-bold border-2 text-white shadow-sm text-xs",
                        isSpeaking && "animate-bounce"
                      )}
                      style={{ 
                        borderColor: COLOR_HEX[color],
                        backgroundColor: `${COLOR_HEX[color]}33`
                      }}
                    >
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    {isSpeaking && (
                      <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-100 animate-ping" />
                      </span>
                    )}
                    {isMuted && !isSpeaking && (
                      <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-red-500 border border-slate-900 flex items-center justify-center">
                        <MicOff className="h-2 w-2 text-white" />
                      </span>
                    )}
                  </div>

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
            <LudoVoicePanel
              micActive={micActive}
              voiceSpeakerEnabled={voiceSpeakerEnabled}
              permissionDenied={permissionDenied}
              onToggleMic={onToggleMic}
              onToggleSpeaker={onToggleSpeaker}
              isCompact={true}
            />
            <LudoChatPanel
              unreadChatCount={unreadChatCount}
              onToggleChat={() => setIsChatOpen(!isChatOpen)}
            />
          </div>
        </div>
      )}

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

          <div className="space-y-3">
            {LUDO_COLORS.slice(0, onlineRoom.maxPlayers).map((color) => {
              const player = onlineRoom.players.find((p) => p.symbol === color);

              return (
                <div
                  key={color}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border backdrop-blur-sm",
                    player ? "glass border-primary/20 bg-primary/5" : "bg-card/35 border-border/30 border-dashed"
                  )}
                >
                  <div className="flex items-center gap-3">
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
                      {player.playerId === onlinePlayerId ? (
                        <Button
                          onClick={() => sendLudoReadyState(!player.isReady)}
                          className={cn(
                            "h-9 px-4 rounded-xl text-xs font-bold transition-all",
                            player.isReady ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-primary text-primary-foreground"
                          )}
                        >
                          {player.isReady ? "Ready ✓" : "Ready Up"}
                        </Button>
                      ) : (
                        <Badge className={cn("text-[10px] font-bold py-1 px-3.5 rounded-lg", player.isReady ? "bg-emerald-500/25 border border-emerald-500/20 text-emerald-400" : "bg-red-500/25 border border-red-500/20 text-red-400")}>
                          {player.isReady ? "Ready" : "Waiting"}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-muted-foreground animate-pulse">Open Slot</span>
                  )}
                </div>
              );
            })}
          </div>

          {isHost && (
            <Button
              onClick={sendLudoStartGame}
              disabled={onlineRoom.players.length < 2 || !onlineRoom.players.every((p) => p.isReady)}
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-black text-sm shadow-md"
            >
              Start Game Room
            </Button>
          )}
        </motion.div>
      )}

      {/* ACTIVE GAME LAYOUT */}
      {onlineRoom.status === "playing" && (
        <div className="w-full max-w-[95vw] lg:max-w-[1000px] flex flex-col lg:flex-row gap-5 items-center justify-center">
          <div className="w-full lg:w-[320px] flex flex-col gap-4">
            <div className="glass rounded-3xl p-5 border border-white/10 flex flex-col gap-4 shadow-xl">
              
              <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-white/5 text-xs text-center font-bold text-muted-foreground min-h-[50px] flex items-center justify-center leading-relaxed">
                {isMyTurn ? (
                  ludoState.hasRolled ? (
                    <span className="text-primary animate-pulse">Select a highlighted token to move.</span>
                  ) : (
                    <span>Your turn! Roll the dice.</span>
                  )
                ) : (
                  <span>Waiting for other players...</span>
                )}
              </div>

              <div className="flex items-center justify-center gap-4 py-4 bg-neutral-900/40 rounded-2xl border border-white/5 relative overflow-hidden">
                <LudoDice
                  activeColor={onlineRoom.currentPlayer as LudoColor}
                  diceRoll={ludoState.diceRoll}
                  tempDiceRoll={tempDiceRoll}
                  hasRolled={ludoState.hasRolled}
                  isRolling={isRolling}
                  isAnimating={isAnimating}
                  isMyTurn={isMyTurn}
                  onRoll={handleRollClick}
                />
                {isMyTurn && !ludoState.hasRolled && !isRolling && !isAnimating && (
                  <Button onClick={handleRollClick} className="rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-black text-xs px-4">
                    Roll Dice
                  </Button>
                )}
                {isMyTurn && ludoState.hasRolled && (
                  <span className="text-[10px] text-primary font-bold animate-pulse">Select Piece</span>
                )}
              </div>

              {ludoState.rankings && ludoState.rankings.length > 0 && (
                <div className="space-y-1.5 pt-3 border-t border-white/5">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Rankings</span>
                  <div className="space-y-1">
                    {ludoState.rankings.map((color, idx) => (
                      <div key={color} className="flex items-center justify-between text-xs bg-white/5 rounded-lg px-3 py-1.5">
                        <span className="font-bold"># {idx + 1}</span>
                        <span className="capitalize font-black" style={{ color: COLOR_HEX[color as LudoColor] }}>{color}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <LudoBoard>
            <LudoTokens
              coordinatesGroups={coordinatesGroups}
              onTokenClick={handleTokenClick}
            />
          </LudoBoard>
        </div>
      )}

      {/* GAME OVER FINISHED SCREEN */}
      {onlineRoom.status === "finished" && (
        <div className="w-full max-w-[95vw] sm:max-w-md space-y-4">
          <div className="glass rounded-3xl p-6 border border-white/10 text-center space-y-4 shadow-xl">
            <h2 className="text-xl font-bold">Game Finished!</h2>
            <p className="text-sm text-muted-foreground">
              Champion: <span className="capitalize font-black" style={{ color: COLOR_HEX[ludoState.winner as LudoColor] }}>{ludoState.winner}</span>
            </p>

            <Button
              onClick={sendRematchRequest}
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-bold shadow-md"
            >
              Request Rematch
            </Button>
          </div>
        </div>
      )}

      {/* Exit confirmation overlay */}
      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-md">
            <div className="w-full max-w-[95vw] sm:max-w-sm glass-strong rounded-3xl p-6 text-center space-y-5 shadow-2xl">
              <h2 className="text-lg font-bold">Leave Room?</h2>
              <p className="text-sm text-muted-foreground">Are you sure you want to leave this game room?</p>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setShowExitConfirm(false)} className="flex-1 h-12 rounded-xl">Stay</Button>
                <Button
                  onClick={() => {
                    playClick();
                    leaveRoom();
                    router.push("/online");
                  }}
                  className="flex-1 h-12 rounded-xl bg-red-650 hover:bg-red-500 text-white font-bold"
                >
                  Leave
                </Button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Render Decoupled Chat Panel */}
      {isChatOpen && chatPanel}
    </div>
  );
}
