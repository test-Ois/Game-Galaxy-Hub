// ============================================================
// Online Gameplay Page — Real-time Multiplayer Arena (Mobile-First)
// ============================================================

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Copy, ArrowLeft, Users, RefreshCw, AlertCircle, CheckCircle2, LogOut, Mic, MicOff, Volume2, VolumeX, Trophy, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Board } from "@/components/game/Board";
import { Scoreboard } from "@/components/game/Scoreboard";
import { useOnlineSocket } from "@/hooks/useOnlineSocket";
import { useGameStore } from "@/stores/gameStore";
import { useSound } from "@/hooks/useSound";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import { ChatPanel } from "@/components/game/ChatPanel";
import { useSettingsStore } from "@/stores/settingsStore";
import { cn } from "@/lib/utils";

const truncateName = (name?: string, maxLen = 8) => {
  if (!name) return "";
  return name.length > maxLen ? name.substring(0, maxLen) + "..." : name;
};

export default function OnlinePlayPage() {
  const router = useRouter();
  const { roomId } = useParams() as { roomId: string };
  
  const { connect, rejoinRoom, sendRematchRequest, declineRematch, leaveRoom, socket } = useOnlineSocket();
  const { playClick, playMove, playError } = useSound();

  const setMode = useGameStore((s) => s.setMode);
  const onlineRoom = useGameStore((s) => s.onlineRoom);
  const onlinePlayerId = useGameStore((s) => s.onlinePlayerId);
  const onlinePlayerSymbol = useGameStore((s) => s.onlinePlayerSymbol);
  
  // Standard series evaluation fields
  const isGameOver = useGameStore((s) => s.isGameOver);
  const isSeriesComplete = useGameStore((s) => s.isSeriesComplete);
  const seriesWinner = useGameStore((s) => s.seriesWinner);
  const board = useGameStore((s) => s.board);

  // Best of series fields
  const currentRound = useGameStore((s) => s.currentRound);
  const maxRounds = useGameStore((s) => s.maxRounds);
  const roundOver = useGameStore((s) => s.roundOver);
  const roundWinner = useGameStore((s) => s.roundWinner);
  const rematchRequests = useGameStore((s) => s.rematchRequests);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const chatHistory = useGameStore((s) => s.chatHistory);
  const prevChatLengthRef = useRef(chatHistory.length);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

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

  // Voice Chat WebRTC configuration
  const opponent = onlineRoom?.players.find((p) => p.playerId !== onlinePlayerId);
  const playerMe = onlineRoom?.players.find((p) => p.playerId === onlinePlayerId);

  const {
    micActive,
    isSelfSpeaking,
    speakingPlayers,
    mutedPlayers,
    connectionStatuses,
    toggleMic,
    permissionDenied,
  } = useVoiceChat({
    socket,
    roomId,
    playerId: onlinePlayerId || "",
    players: onlineRoom?.players || [],
  });

  const isOpponentSpeaking = opponent ? (speakingPlayers[opponent.playerId] || false) : false;
  const isOpponentMuted = opponent ? (mutedPlayers[opponent.playerId] || false) : false;
  const connectionStatus = opponent ? (connectionStatuses[opponent.playerId] || "") : "";

  const voiceSpeakerEnabled = useSettingsStore((s) => s.voiceSpeakerEnabled);
  const toggleVoiceSpeaker = useSettingsStore((s) => s.toggleVoiceSpeaker);



  // UI state variables
  const [toast, setToast] = useState<string | null>(null);
  const [hasShareApi, setHasShareApi] = useState(false);

  // Modals and exit state
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showOpponentLeftModal, setShowOpponentLeftModal] = useState(false);
  const [waitTimer, setWaitTimer] = useState(30);
  const [waitingActive, setWaitingActive] = useState(false);
  const [rematchDeclinedNotice, setRematchDeclinedNotice] = useState(false);

  // Toast helper
  const showToastMsg = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleConfirmExit = useCallback(() => {
    playClick();
    leaveRoom();
    router.push("/online");
  }, [playClick, leaveRoom, router]);

  // Re-connect / Join verify loop runs strictly ONCE on mount
  useEffect(() => {
    connect();
    setMode("online");
    rejoinRoom(roomId);

    // Detect Web Share API support
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== "undefined" && (navigator as any).share) {
      setTimeout(() => {
        setHasShareApi(true);
      }, 0);
    }
  }, [connect, rejoinRoom, roomId, setMode]);

  // Audio buzz on move
  useEffect(() => {
    const activeMoves = board.filter((c) => c !== null).length;
    if (activeMoves > 0) {
      playMove();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board]);

  // Trigger canvas-confetti on series victory
  useEffect(() => {
    if (isGameOver && isSeriesComplete && seriesWinner === onlinePlayerSymbol) {
      import("canvas-confetti").then((module) => {
        const confetti = module.default;
        const duration = 2.5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 28, spread: 360, ticks: 50, zIndex: 100 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval = setInterval(function() {
          const timeLeft = animationEnd - Date.now();
          if (timeLeft <= 0) {
            return clearInterval(interval);
          }
          const particleCount = 40 * (timeLeft / duration);
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
      });
    }
  }, [isGameOver, isSeriesComplete, seriesWinner, onlinePlayerSymbol]);

  // Intercept browser back navigation
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
      playClick();
      setShowExitConfirm(true);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [playClick]);

  // Listen for opponent socket exit
  useEffect(() => {
    if (!socket) return;

    const handleOpponentLeft = () => {
      playError();
      setShowOpponentLeftModal(true);
    };

    const handleRematchDeclined = () => {
      playError();
      setRematchDeclinedNotice(true);
      setTimeout(() => setRematchDeclinedNotice(false), 4000);
    };

    socket.on("opponentLeftRoom", handleOpponentLeft);
    socket.on("rematchDeclined", handleRematchDeclined);

    return () => {
      socket.off("opponentLeftRoom", handleOpponentLeft);
      socket.off("rematchDeclined", handleRematchDeclined);
    };
  }, [socket, playError]);

  // 30s countdown timer for opponent leaving
  useEffect(() => {
    if (!waitingActive || waitTimer <= 0) {
      if (waitingActive && waitTimer === 0) {
        handleConfirmExit();
      }
      return;
    }

    const interval = setInterval(() => {
      setWaitTimer((t) => t - 1);
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waitingActive, waitTimer]);

  const getInviteLink = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/play/online/${roomId}`;
    }
    return `https://game-galaxy-hub.vercel.app/play/online/${roomId}`;
  };

  const handleCopyRoomId = () => {
    playClick();
    navigator.clipboard.writeText(roomId);
    showToastMsg("Room ID copied successfully!");
  };

  const handleCopyInviteLink = () => {
    playClick();
    navigator.clipboard.writeText(getInviteLink());
    showToastMsg("Invite link copied successfully!");
  };

  const handleWhatsAppShare = () => {
    playClick();
    const text = encodeURIComponent(`Join my Game Galaxy Hub room: ${getInviteLink()}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleNativeShare = async () => {
    playClick();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nav = navigator as any;
    if (nav.share) {
      try {
        await nav.share({
          title: "Game Galaxy Hub",
          text: "Join my room",
          url: getInviteLink(),
        });
      } catch (err) {
        console.warn("Share sheet closed/failed:", err);
      }
    }
  };

  if (!onlineRoom) {
    return (
      <div className="min-h-[calc(100vh-6rem)] sm:min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center gap-4 px-3 sm:px-4">
        <RefreshCw className="h-10 w-10 text-primary animate-spin" />
        <p className="text-muted-foreground text-sm font-medium">Entering online arena...</p>
      </div>
    );
  }

  const isMatchActive = onlineRoom.status === "playing" && !isGameOver;

  // ─── WAITING ROOM LOBBY ───
  if (onlineRoom.status === "waiting") {
    return (
      <div className="relative min-h-[calc(100vh-6rem)] sm:min-h-[calc(100vh-8rem)] flex items-center justify-center px-3 sm:px-4 py-6 sm:py-8 select-none">
        
        {/* Back Button (Mobile touch target size >= 44px) */}
        <div className="absolute top-4 left-4 z-40">
          <Button
            onClick={() => {
              playClick();
              setShowExitConfirm(true);
            }}
            variant="ghost"
            size="icon"
            className="w-12 h-12 rounded-full glass hover:bg-accent transition-all"
            aria-label="Back to Lobby"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[95vw] sm:max-w-lg space-y-4 sm:space-y-6 mt-8"
        >
          {/* Header */}
          <div className="text-center space-y-1">
            <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary mb-1">
              Waiting Room
            </Badge>
            <h1 className="text-xl sm:text-2xl font-black">Lobby Room #{roomId}</h1>
            <p className="text-xs text-muted-foreground">
              Share the Room ID or invite link below with a friend
            </p>
          </div>

          {/* Lobby Slots Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Slot 1: Host */}
            <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-between text-center space-y-3 sm:space-y-4 border border-border/50 relative overflow-hidden bg-card/20">
              <div className="absolute top-2 right-2">
                <Badge className="bg-primary/20 text-primary border-primary/30 text-[9px] font-bold">
                  HOST
                </Badge>
              </div>
              <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg relative border-2 border-primary/40">
                <span className="text-lg sm:text-xl font-black text-white">{playerMe?.name?.charAt(0).toUpperCase() || "H"}</span>
                <span className="absolute bottom-0 right-0 h-4.5 w-4.5 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
                  <span className="h-2 w-2 rounded-full bg-green-200 animate-ping" />
                </span>
              </div>
              <div>
                <h3 className="font-bold text-sm truncate max-w-[120px]">{playerMe?.name} (You)</h3>
                <span className="text-[10px] text-muted-foreground font-semibold">Symbol O</span>
              </div>
              
              <div className="flex gap-2 w-full">
                <Button
                  onClick={toggleMic}
                  variant="outline"
                  className={cn(
                    "flex-1 h-11 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border border-border/50 transition-all",
                    micActive 
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.25)] font-extrabold" 
                      : "bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/20"
                  )}
                  aria-label={micActive ? "Mute Microphone" : "Unmute Microphone"}
                >
                  {micActive ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  <span>{micActive ? "Mic" : "Muted"}</span>
                </Button>
                <Button
                  onClick={toggleVoiceSpeaker}
                  variant="outline"
                  className={cn(
                    "flex-1 h-11 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border border-border/50 transition-all",
                    voiceSpeakerEnabled 
                      ? "bg-sky-500/10 text-sky-500 border-sky-500/30 hover:bg-sky-500/20 shadow-[0_0_12px_rgba(14,165,233,0.25)] font-extrabold" 
                      : "bg-gray-500/10 text-gray-500 border-gray-500/30 hover:bg-gray-500/20"
                  )}
                  aria-label={voiceSpeakerEnabled ? "Mute Opponent Voice" : "Unmute Opponent Voice"}
                >
                  {voiceSpeakerEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  <span>{voiceSpeakerEnabled ? "Speaker" : "Muted"}</span>
                </Button>
              </div>
            </div>

            {/* Slot 2: Opponent Slot */}
            <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center space-y-3 sm:space-y-4 border border-dashed border-border/80 min-h-[160px] sm:min-h-[180px] relative overflow-hidden bg-card/5">
              <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-full bg-muted/40 border border-dashed border-border flex items-center justify-center relative animate-pulse">
                <Users className="h-6 w-6 text-muted-foreground/50" />
                <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-amber-500 border-2 border-background flex items-center justify-center">
                  <span className="h-2 w-2 rounded-full bg-amber-200 animate-ping" />
                </span>
              </div>
              <div className="space-y-0.5">
                <h3 className="font-bold text-xs text-muted-foreground animate-pulse">Waiting for Opponent</h3>
                <p className="text-[10px] text-muted-foreground/60 max-w-[150px] mx-auto">
                  Awaiting Player 2 to join...
                </p>
              </div>
              
              <Button
                onClick={handleCopyInviteLink}
                variant="outline"
                size="sm"
                className="w-full h-9 rounded-xl text-[11px] font-bold border-border/50 flex items-center justify-center gap-1.5 hover:bg-accent"
              >
                <Share2 className="h-3.5 w-3.5" />
                Invite Friend
              </Button>
            </div>
          </div>

          {/* Room details & share actions */}
          <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-5 space-y-3 sm:space-y-4 border border-border/50 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest block mb-0.5">
                  Room ID
                </span>
                <span className="text-xl sm:text-2xl font-black text-primary font-mono select-all tracking-widest">
                  {roomId}
                </span>
              </div>
              <Button
                onClick={handleCopyRoomId}
                className="h-10 rounded-xl bg-card/60 border border-border/60 hover:bg-accent text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs font-bold px-4 shadow-sm"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy ID
              </Button>
            </div>

            <hr className="border-border/30" />

            {/* Quick Share buttons (Stacked on mobile, side-by-side on desktop) */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <Button
                onClick={handleWhatsAppShare}
                className="w-full sm:flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5"
              >
                📲 WhatsApp
              </Button>
              {hasShareApi ? (
                <Button
                  onClick={handleNativeShare}
                  className="w-full sm:flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-md flex items-center justify-center gap-1.5"
                >
                  📤 Native Share
                </Button>
              ) : (
                <Button
                  onClick={handleCopyInviteLink}
                  className="w-full sm:flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-md flex items-center justify-center gap-1.5"
                >
                  🔗 Copy Invite
                </Button>
              )}
            </div>
          </div>

          {/* Lobby settings display */}
          <div className="glass rounded-lg sm:rounded-xl p-2.5 sm:p-3 flex flex-wrap justify-around gap-1 text-[9px] sm:text-[10px] text-muted-foreground font-bold border border-border/30">
            <span>Dimensions: {onlineRoom.settings.boardSize}x{onlineRoom.settings.boardSize}</span>
            <span>•</span>
            <span>Series: Best of {onlineRoom.settings.seriesMode}</span>
          </div>
        </motion.div>

        {/* Local confirmation modal */}
        <AnimatePresence>
          {showExitConfirm && (
            <ExitConfirmationModal
              isMatchActive={false}
              onClose={() => setShowExitConfirm(false)}
              onConfirm={handleConfirmExit}
            />
          )}
        </AnimatePresence>

        {/* Glassmorphic Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 glass-strong px-5 py-3 rounded-full text-xs font-bold text-emerald-500 shadow-xl border border-emerald-500/20 flex items-center gap-2 bg-background/95"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>{toast}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ─── PLAYING / COMPLETED GAME STATE ───
  const isOpponentDisconnected = opponent ? !opponent.isConnected : false;
  const isMyTurn = onlineRoom.currentPlayer === playerMe?.symbol;

  const hasRequestedRematch = rematchRequests.includes(onlinePlayerId || "");
  const hasOpponentRequestedRematch = opponent ? rematchRequests.includes(opponent.playerId) : false;

  return (
    <div className="relative min-h-[calc(100vh-6rem)] sm:min-h-[calc(100vh-8rem)] flex items-center justify-center px-2 sm:px-4 py-4 sm:py-8">
      
      {/* Back Button (Mobile touch target size >= 44px) */}
      <div className="absolute top-4 left-4 z-40">
        <Button
          onClick={() => {
            playClick();
            setShowExitConfirm(true);
          }}
          variant="ghost"
          size="icon"
          className="w-12 h-12 rounded-full glass hover:bg-accent transition-all"
          aria-label="Exit Game"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-[96vw] sm:max-w-lg space-y-3 sm:space-y-4 mt-6 sm:mt-8"
      >
        {/* Top Invite Banner (Small invite section in gameplay header, stacked on mobile) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between glass rounded-xl sm:rounded-2xl p-3 sm:px-4 sm:py-2.5 max-w-md mx-auto w-full border border-border/50 shadow-sm gap-2 sm:gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-4">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">
                Room ID
              </span>
              <span className="font-mono text-base font-extrabold text-primary select-all tracking-wider">
                {roomId}
              </span>
            </div>
            {connectionStatus && (
              <Badge className={cn(
                "border text-[9px] font-black py-1 h-9 px-2.5 rounded-xl shrink-0 flex items-center justify-center gap-1.5 transition-all shadow-sm",
                connectionStatus === "connected"
                  ? "bg-emerald-500/10 border-emerald-500/35 text-emerald-500 shadow-emerald-500/5"
                  : ["connecting", "checking", "new"].includes(connectionStatus)
                    ? "bg-amber-500/10 border-amber-500/35 text-amber-500 animate-pulse shadow-amber-500/5"
                    : "bg-red-500/10 border-red-500/35 text-red-500 shadow-red-500/5"
              )}>
                🎙️ {connectionStatus.toUpperCase()}
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-stretch sm:justify-end gap-1.5 sm:gap-2 w-full sm:w-auto">
            <Button
              onClick={() => {
                playClick();
                setIsChatOpen(true);
              }}
              variant="outline"
              size="icon"
              className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl shrink-0 border border-border/50 hover:bg-accent transition-all relative"
              aria-label="Open Room Chat"
            >
              <MessageSquare className="h-4 w-4 text-primary" />
              {unreadChatCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
                  {unreadChatCount}
                </span>
              )}
            </Button>
            <Button
              onClick={toggleMic}
              variant="outline"
              size="icon"
              className={cn(
                "h-10 w-10 sm:h-11 sm:w-11 rounded-xl shrink-0 border border-border/50 transition-all",
                micActive 
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.25)]" 
                  : "bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/20"
              )}
              aria-label={micActive ? "Mute Microphone" : "Unmute Microphone"}
            >
              {micActive ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </Button>
            <Button
              onClick={toggleVoiceSpeaker}
              variant="outline"
              size="icon"
              className={cn(
                "h-10 w-10 sm:h-11 sm:w-11 rounded-xl shrink-0 border border-border/50 transition-all",
                voiceSpeakerEnabled 
                  ? "bg-sky-500/10 text-sky-500 border-sky-500/30 hover:bg-sky-500/20 shadow-[0_0_12px_rgba(14,165,233,0.25)]" 
                  : "bg-gray-500/10 text-gray-500 border-gray-500/30 hover:bg-gray-500/20"
              )}
              aria-label={voiceSpeakerEnabled ? "Mute Opponent Voice" : "Unmute Opponent Voice"}
            >
              {voiceSpeakerEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button
              onClick={handleCopyRoomId}
              variant="outline"
              className="flex-1 sm:flex-initial h-10 sm:h-11 px-3 sm:px-4 rounded-xl font-bold text-[10px] sm:text-xs flex items-center justify-center gap-1 sm:gap-1.5 border-border/50 bg-card/40 hover:bg-accent"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy ID
            </Button>
            <Button
              onClick={hasShareApi ? handleNativeShare : handleCopyInviteLink}
              className="flex-1 sm:flex-initial h-10 sm:h-11 px-3 sm:px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-[10px] sm:text-xs flex items-center justify-center gap-1 sm:gap-1.5 shadow-sm"
            >
              <Share2 className="h-3.5 w-3.5" />
              Invite Link
            </Button>
          </div>
        </div>

        {/* Microphone Blocked Notice */}
        {permissionDenied && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl p-3 text-xs font-bold text-center shadow-lg"
          >
            ⚠️ Microphone blocked. Please allow mic access in your browser settings to use voice chat.
          </motion.div>
        )}

        {/* Opponent Explicit Exit countdown banner */}
        {waitingActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl p-3 text-xs font-bold flex items-center justify-between shadow-lg"
          >
            <span>⚠️ Opponent left. Returning to lobby in {waitTimer}s...</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleConfirmExit}
              className="text-red-500 hover:bg-red-500/20 text-[10px] font-black h-7 rounded-lg px-2"
            >
              Exit Now
            </Button>
          </motion.div>
        )}

        {/* Reconnect Grace Period Notification Banner */}
        <AnimatePresence>
          {isOpponentDisconnected && !waitingActive && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl p-3 text-xs font-semibold flex items-center gap-2 justify-center shadow-lg"
            >
              <AlertCircle className="h-4 w-4 animate-bounce shrink-0" />
              <span>{opponent?.name || "Opponent"} disconnected. Waiting for rejoin...</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Name badges with custom player cards */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4 items-center px-0 sm:px-1">
          {/* Card 1: Local Player (You) */}
          <div className={cn(
            "glass rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3 border border-border/50 transition-all",
            isSelfSpeaking && "border-green-500 bg-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.25)]"
          )}>
            <div className="relative shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-600 flex items-center justify-center shadow-md border border-primary/20 text-white font-black text-xs sm:text-sm">
                {playerMe?.name?.charAt(0).toUpperCase() || "Y"}
              </div>
              <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
                <span className="h-1.5 w-1.5 rounded-full bg-green-100" />
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-[10px] sm:text-xs truncate">{truncateName(playerMe?.name || "Guest", 6)} (You)</h4>
              <div className="flex items-center gap-1.5">
                <span className={cn("text-[10px] font-black uppercase tracking-wider", onlinePlayerSymbol === "O" ? "text-game-o" : "text-game-x")}>
                  Symbol {onlinePlayerSymbol}
                </span>
                {isSelfSpeaking && (
                  <div className="flex gap-0.5 items-end h-2 w-3.5">
                    <span className="w-0.5 bg-green-500 animate-pulse" style={{ height: "40%" }} />
                    <span className="w-0.5 bg-green-500 animate-pulse" style={{ height: "100%", animationDelay: "0.2s" }} />
                    <span className="w-0.5 bg-green-500 animate-pulse" style={{ height: "60%", animationDelay: "0.1s" }} />
                  </div>
                )}
              </div>
            </div>
            {!micActive && <MicOff className="h-3.5 w-3.5 text-red-500 shrink-0" />}
          </div>

          {/* Card 2: Opponent Player */}
          <div className={cn(
            "glass rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3 border border-border/50 transition-all",
            isOpponentSpeaking && "border-green-500 bg-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.25)]"
          )}>
            <div className="relative shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-emerald-600 flex items-center justify-center shadow-md border border-primary/20 text-white font-black text-xs sm:text-sm">
                {opponent?.name?.charAt(0).toUpperCase() || "O"}
              </div>
              <span className={cn(
                "absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-background flex items-center justify-center",
                isOpponentDisconnected ? "bg-amber-500" : "bg-green-500"
              )}>
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-[10px] sm:text-xs truncate">{truncateName(opponent?.name || "Guest", 6)}</h4>
              <div className="flex items-center gap-1.5">
                <span className={cn("text-[10px] font-black uppercase tracking-wider", onlinePlayerSymbol === "O" ? "text-game-x" : "text-game-o")}>
                  Symbol {onlinePlayerSymbol === "O" ? "X" : "O"}
                </span>
                {isOpponentSpeaking && (
                  <div className="flex gap-0.5 items-end h-2 w-3.5">
                    <span className="w-0.5 bg-green-500 animate-pulse" style={{ height: "40%" }} />
                    <span className="w-0.5 bg-green-500 animate-pulse" style={{ height: "100%", animationDelay: "0.2s" }} />
                    <span className="w-0.5 bg-green-500 animate-pulse" style={{ height: "60%", animationDelay: "0.1s" }} />
                  </div>
                )}
              </div>
            </div>
            {isOpponentMuted && <MicOff className="h-3.5 w-3.5 text-red-500 shrink-0" />}
          </div>
        </div>

        {/* Round & Turn Tracker Bar */}
        <div className="flex flex-wrap justify-center items-center gap-1.5 sm:gap-2">
          <Badge variant="outline" className="bg-card/40 border-border/50 text-muted-foreground font-bold px-3 py-1">
            Round {currentRound} / {maxRounds}
          </Badge>
          {!isGameOver && (
            <Badge
              variant="secondary"
              className={cn(
                "px-3 py-1 text-xs font-bold transition-all border",
                isMyTurn
                  ? "bg-primary/20 text-primary border-primary/30 animate-pulse"
                  : "bg-muted text-muted-foreground border-transparent"
              )}
            >
              {isMyTurn ? "🟢 YOUR TURN" : "⏳ OPPONENT'S TURN"}
            </Badge>
          )}
        </div>

        {/* Game Scoreboard */}
        <Scoreboard />

        {/* Main Grid Board Container */}
        <div className="relative flex justify-center w-full my-2 sm:my-4">
          <Board />

          {/* Round Over Victory Overlay */}
          <AnimatePresence>
            {roundOver && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-background/80 backdrop-blur-[2px] z-30 flex flex-col items-center justify-center rounded-2xl"
              >
                <motion.div
                  initial={{ y: 15, scale: 0.9 }}
                  animate={{ y: 0, scale: 1 }}
                  exit={{ y: 15, scale: 0.9 }}
                  className="text-center space-y-3 p-4 sm:p-6 glass-strong rounded-2xl sm:rounded-3xl border border-border/50 max-w-[260px] sm:max-w-[280px]"
                >
                  <h3 className="text-xs font-black text-primary tracking-widest uppercase">
                    Round {currentRound} Complete
                  </h3>
                  <p className="text-xl font-extrabold text-foreground leading-tight">
                    {roundWinner === "draw"
                      ? "It's a Draw! 🤝"
                      : roundWinner === onlinePlayerSymbol
                        ? "Round Victory! 🎉"
                        : "Opponent Wins Round 😢"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Preparing next round...
                  </p>
                  <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden mt-1 max-w-[150px] mx-auto">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 2.3, ease: "linear" }}
                      className="bg-primary h-full rounded-full"
                    />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Fullscreen Victory / Series End Modal Overlay */}
        {isGameOver && isSeriesComplete && !waitingActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-background/70 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-[92vw] sm:max-w-sm glass-strong rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-center space-y-4 sm:space-y-5 shadow-2xl border border-border/40"
            >
              <div className="mx-auto h-16 w-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-lg relative border border-amber-500/20">
                <Trophy className="h-8 w-8 animate-bounce" />
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-foreground tracking-tight">
                  {seriesWinner === onlinePlayerSymbol ? "🏆 Series Victory!" : "Series Finished"}
                </h2>
                <p className="text-xs text-muted-foreground px-2">
                  {seriesWinner === onlinePlayerSymbol 
                    ? "Congratulations, you are the series champion!" 
                    : `${opponent?.name || "Opponent"} won the series match.`}
                </p>
              </div>

              {/* Score breakdown recap */}
              <div className="bg-card/45 border border-border/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 grid grid-cols-3 gap-1.5 sm:gap-2 text-center items-center">
                <div>
                  <span className="text-[10px] uppercase font-black text-muted-foreground">You</span>
                  <p className="text-lg font-black text-primary mt-1">{onlinePlayerSymbol === "O" ? onlineRoom.seriesWins.O : onlineRoom.seriesWins.X}</p>
                </div>
                <div className="text-xs text-muted-foreground/50 font-bold border-x border-border/40 py-1">
                  VS
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-muted-foreground">{opponent?.name || "Guest"}</span>
                  <p className="text-lg font-black text-red-500 mt-1">{onlinePlayerSymbol === "O" ? onlineRoom.seriesWins.X : onlineRoom.seriesWins.O}</p>
                </div>
              </div>

              {/* Rematch Requests Acceptance Status */}
              {rematchDeclinedNotice && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl p-2.5 text-center text-xs font-bold animate-fade-in">
                  ❌ Rematch request declined by opponent.
                </div>
              )}

              {/* Rematch Actions Panel (Stacked vertically on mobile, row on desktop) */}
              {hasOpponentRequestedRematch && !hasRequestedRematch ? (
                <div className="space-y-2">
                  <div className="bg-primary/10 border border-primary/20 text-primary rounded-xl p-2.5 text-center text-xs font-bold animate-pulse">
                    🤝 {opponent?.name} has requested a rematch
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={() => {
                        playClick();
                        declineRematch();
                      }}
                      variant="outline"
                      className="w-full sm:flex-1 h-12 rounded-xl text-xs font-bold border-red-500/30 text-red-500 hover:bg-red-500/10"
                    >
                      Decline
                    </Button>
                    <Button
                      onClick={() => {
                        playClick();
                        sendRematchRequest();
                      }}
                      className="w-full sm:flex-1 h-12 rounded-xl text-xs font-extrabold bg-primary text-primary-foreground shadow-md"
                    >
                      Accept Rematch
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={() => {
                      playClick();
                      setShowExitConfirm(true);
                    }}
                    variant="outline"
                    className="w-full sm:flex-1 h-12 rounded-xl text-xs font-bold border-border/50"
                  >
                    Quit Lobby
                  </Button>
                  <Button
                    onClick={() => {
                      playClick();
                      sendRematchRequest();
                    }}
                    disabled={hasRequestedRematch}
                    className={cn(
                      "w-full sm:flex-1 h-12 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md",
                      hasRequestedRematch ? "bg-muted text-muted-foreground border border-transparent" : "bg-primary text-primary-foreground"
                    )}
                  >
                    {hasRequestedRematch ? (
                      <span className="flex items-center gap-1.5">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Waiting...
                      </span>
                    ) : (
                      <>
                        <RefreshCw className="h-3.5 w-3.5" />
                        Play Rematch
                      </>
                    )}
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

      </motion.div>

      {/* Global Modals */}
      <AnimatePresence>
        {/* Leave Room Modal */}
        {showExitConfirm && (
          <ExitConfirmationModal
            isMatchActive={isMatchActive}
            onClose={() => setShowExitConfirm(false)}
            onConfirm={handleConfirmExit}
          />
        )}

        {/* Opponent Left Modal */}
        {showOpponentLeftModal && (
          <OpponentLeftModal
            onClose={() => setShowOpponentLeftModal(false)}
            onWait={() => {
              playClick();
              setShowOpponentLeftModal(false);
              setWaitTimer(30);
              setWaitingActive(true);
            }}
            onConfirmExit={handleConfirmExit}
          />
        )}
      </AnimatePresence>

      {/* Glassmorphic Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 glass-strong px-5 py-3 rounded-full text-xs font-bold text-emerald-500 shadow-xl border border-emerald-500/20 flex items-center gap-2 bg-background/95"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>



      <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}

// ─── LOCAL COMPONENTS ───────────────────────────────────────

interface ExitModalProps {
  isMatchActive: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function ExitConfirmationModal({ isMatchActive, onClose, onConfirm }: ExitModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 15 }}
        className="w-full max-w-[95vw] sm:max-w-sm glass-strong rounded-3xl p-6 text-center space-y-5 shadow-2xl"
      >
        <div className="mx-auto h-12 w-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center">
          <LogOut className="h-6 w-6" />
        </div>
        
        <div className="space-y-1">
          <h2 className="text-lg font-bold">Leave Room?</h2>
          <p className="text-sm text-muted-foreground px-2">
            Are you sure you want to leave this room?
          </p>
          {isMatchActive && (
            <p className="text-xs font-bold text-red-500 mt-1">
              ⚠️ Leaving now will end your current match.
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full sm:flex-1 h-12 rounded-xl text-sm font-semibold border border-border/30 hover:bg-card/40"
          >
            Stay
          </Button>
          <Button
            onClick={onConfirm}
            className="w-full sm:flex-1 h-12 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-500/15"
          >
            Leave Room
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface OpponentLeftModalProps {
  onClose: () => void;
  onWait: () => void;
  onConfirmExit: () => void;
}

function OpponentLeftModal({ onWait, onConfirmExit }: OpponentLeftModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 15 }}
        className="w-full max-w-[95vw] sm:max-w-sm glass-strong rounded-3xl p-6 text-center space-y-5 shadow-2xl"
      >
        <div className="mx-auto h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center animate-pulse">
          <AlertCircle className="h-6 w-6" />
        </div>
        
        <div className="space-y-1">
          <h2 className="text-lg font-bold">Opponent has left the room.</h2>
          <p className="text-sm text-muted-foreground px-2">
            Your opponent has left the match.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={onWait}
            className="w-full sm:flex-1 h-12 rounded-xl text-sm font-bold bg-primary text-primary-foreground shadow-md"
          >
            Wait
          </Button>
          <Button
            variant="ghost"
            onClick={onConfirmExit}
            className="w-full sm:flex-1 h-12 rounded-xl text-sm font-semibold border border-border/30 hover:bg-card/40"
          >
            Exit
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
