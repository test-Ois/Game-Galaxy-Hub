// ============================================================
// Online Lobby Page — Join or Create Online Arenas (Mobile-First)
// ============================================================

"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Gamepad2, Plus, LogIn, Grid3X3, Trophy, ChevronRight, User, ArrowLeft, Users } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { useOnlineSocket } from "@/features/multiplayer";
import { useGameStore } from "@/store/gameStore";
import { useSound } from "@/shared/hooks/useSound";
import type { BoardSize, SeriesMode } from "@/shared/types/game";

function OnlineLobbyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createRoom, joinRoom, connect } = useOnlineSocket();
  const setMode = useGameStore((s) => s.setMode);
  const { playClick } = useSound();

  // Nickname state
  const [nickname, setNickname] = useState("");
  
  // Create Room state
  const gameParam = searchParams.get("game");
  const [gameChoice, setGameChoice] = useState<"tictactoe" | "ludo" | "wordbattle">((() => {
    return gameParam === "ludo" || gameParam === "tictactoe" || gameParam === "wordbattle" ? gameParam : "tictactoe";
  }) as any);
  const [ludoMaxPlayers, setLudoMaxPlayers] = useState<number>(4);
  const [boardSize, setBoardSize] = useState<BoardSize>(3);
  const [seriesMode, setSeriesMode] = useState<SeriesMode>(3);
  
  // Join Room state
  const [joinCode, setJoinCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [prevGameParam, setPrevGameParam] = useState(gameParam);
  if (gameParam !== prevGameParam) {
    setPrevGameParam(gameParam);
    if (gameParam === "ludo" || gameParam === "tictactoe" || gameParam === "wordbattle") {
      setGameChoice(gameParam as any);
    }
  }

  // Initialize socket connection and cache nickname
  useEffect(() => {
    connect();
    setMode("online");
    const cachedName = localStorage.getItem("ttt-nickname");
    const timer = setTimeout(() => {
      if (cachedName) {
        setNickname(cachedName);
      } else {
        // Random guest name generator
        const randomId = Math.floor(1000 + Math.random() * 9000);
        setNickname(`Guest-${randomId}`);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [connect, setMode]);

  const saveNickname = (val: string) => {
    setNickname(val);
    localStorage.setItem("ttt-nickname", val);
  };

  const handleCreateRoom = () => {
    if (!nickname.trim()) {
      setErrorMsg("Please enter a nickname.");
      return;
    }
    setIsLoading(true);
    setErrorMsg("");
    if (gameChoice === "ludo") {
      createRoom(nickname, "ludo", ludoMaxPlayers, 15, 1, (roomId: string) => {
        setIsLoading(false);
        router.push(`/play/ludo/${roomId}`);
      });
    } else if (gameChoice === "wordbattle") {
      createRoom(nickname, "wordbattle", 2, 0, 0, (roomId: string) => {
        setIsLoading(false);
        router.push(`/play/wordbattle/${roomId}`);
      });
    } else {
      createRoom(nickname, "tictactoe", 2, boardSize, seriesMode, (roomId: string) => {
        setIsLoading(false);
        router.push(`/play/online/${roomId}`);
      });
    }
  };

  const handleJoinRoom = () => {
    if (!nickname.trim()) {
      setErrorMsg("Please enter a nickname.");
      return;
    }
    if (!joinCode.trim() || joinCode.length !== 6) {
      setErrorMsg("Please enter a valid 6-character Room Code.");
      return;
    }
    setIsLoading(true);
    setErrorMsg("");
    joinRoom(
      nickname,
      joinCode,
      (roomId, gameType) => {
        setIsLoading(false);
        if (gameType === "ludo") {
          router.push(`/play/ludo/${roomId}`);
        } else if (gameType === "wordbattle") {
          router.push(`/play/wordbattle/${roomId}`);
        } else {
          router.push(`/play/online/${roomId}`);
        }
      },
      (err) => {
        setIsLoading(false);
        setErrorMsg(err);
      }
    );
  };

  return (
    <div className="relative min-h-[calc(100vh-6rem)] sm:min-h-[calc(100vh-8rem)] flex items-center justify-center px-3 sm:px-4 py-6 sm:py-8 select-none">
      {/* Back Button (Mobile touch target size >= 44px) */}
      <div className="absolute top-4 left-4 z-40">
        <Button
          onClick={() => {
            playClick();
            router.push("/play");
          }}
          variant="ghost"
          size="icon"
          className="w-12 h-12 rounded-full glass hover:bg-accent transition-all"
          aria-label="Back to Mode Selection"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[95vw] sm:max-w-md space-y-4 sm:space-y-6"
      >
        {/* Title */}
        <div className="text-center">
          <Badge variant="outline" className="mb-2 bg-primary/10 border-primary/20 text-primary">
            🌐 Live Multiplayer
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Arena Lobby</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Challenge players worldwide or host a private match
          </p>
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl p-3 text-sm text-center font-medium"
          >
            ⚠️ {errorMsg}
          </motion.div>
        )}

        {/* Nickname Input Card */}
        <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-5 space-y-3 w-full">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <User className="h-4 w-4 text-primary" />
            <span>Player Nickname</span>
          </div>
          <input
            type="text"
            maxLength={15}
            placeholder="Enter Guest Nickname"
            value={nickname}
            onChange={(e) => saveNickname(e.target.value)}
            className="w-full h-12 px-4 rounded-xl bg-card/60 border border-border/60 text-base font-medium focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all"
          />
        </div>

        {/* Action Accordions / Cards */}
        <div className="space-y-4 sm:space-y-5 w-full">
          {/* Join Arena Card */}
          <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-5 space-y-3 sm:space-y-4 w-full">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <LogIn className="h-4 w-4" />
              </div>
              <h2 className="text-base font-bold">Join Arena</h2>
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                placeholder="6-Digit Code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="flex-[2.5] h-12 px-3 sm:px-4 rounded-xl bg-card/60 border border-border/60 text-center font-mono font-bold tracking-widest outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all text-base"
              />
              <Button
                onClick={handleJoinRoom}
                disabled={isLoading || !joinCode}
                className="flex-1 h-12 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-1"
              >
                Join
                <ChevronRight className="h-4 w-4 shrink-0" />
              </Button>
            </div>
          </div>

          {/* Create Arena Card */}
          <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-5 space-y-4 w-full">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Plus className="h-4 w-4" />
              </div>
              <h2 className="text-base font-bold">Create Arena</h2>
            </div>

            {/* Game Choice Selector */}
            <div className="space-y-2.5">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Gamepad2 className="h-3.5 w-3.5" />
                Select Game
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(["tictactoe", "ludo", "wordbattle"] as const).map((choice) => (
                  <button
                    key={choice}
                    onClick={() => {
                      playClick();
                      setGameChoice(choice);
                    }}
                    className={`h-11 sm:h-12 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-xs border transition-all ${
                      gameChoice === choice
                        ? "bg-primary border-primary text-primary-foreground shadow-md"
                        : "bg-card/40 border-border/60 text-muted-foreground hover:bg-card/60"
                    }`}
                  >
                    {choice === "tictactoe" ? "Tic-Tac-Toe" : choice === "ludo" ? "Online Ludo" : "Word Battle"}
                  </button>
                ))}
              </div>
            </div>

            {/* Conditional Sub-settings */}
            {gameChoice === "tictactoe" ? (
              <>
                {/* Board Size Selector */}
                <div className="space-y-2.5 animate-fadeIn">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Grid3X3 className="h-3.5 w-3.5" />
                    Board Dimensions
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {([3, 4, 5] as BoardSize[]).map((size) => (
                      <button
                        key={size}
                        onClick={() => setBoardSize(size)}
                        className={`h-11 sm:h-12 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm border transition-all ${
                          boardSize === size
                            ? "bg-primary/20 border-primary text-primary hover:bg-primary/25"
                            : "bg-card/40 border-border/60 text-muted-foreground hover:bg-card/60"
                        }`}
                      >
                        {size} × {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Series mode Selector */}
                <div className="space-y-2.5 animate-fadeIn">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Trophy className="h-3.5 w-3.5" />
                    Series Match Rules
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {([1, 3, 5] as SeriesMode[]).map((modeVal) => (
                      <button
                        key={modeVal}
                        onClick={() => setSeriesMode(modeVal)}
                        className={`h-11 sm:h-12 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm border transition-all ${
                          seriesMode === modeVal
                            ? "bg-primary/20 border-primary text-primary hover:bg-primary/25"
                            : "bg-card/40 border-border/60 text-muted-foreground hover:bg-card/60"
                        }`}
                      >
                        {modeVal === 1 ? "Single" : `Best of ${modeVal}`}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : gameChoice === "ludo" ? (
              /* Ludo Player Limit Selector */
              <div className="space-y-2.5 animate-fadeIn">
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  Max Players Limit
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {([2, 3, 4] as const).map((num) => (
                    <button
                      key={num}
                      onClick={() => setLudoMaxPlayers(num)}
                      className={`h-11 sm:h-12 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm border transition-all ${
                        ludoMaxPlayers === num
                          ? "bg-primary/20 border-primary text-primary hover:bg-primary/25"
                          : "bg-card/40 border-border/60 text-muted-foreground hover:bg-card/60"
                      }`}
                    >
                      {num} Players
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Word Battle Selector Informational Banner */
              <div className="p-3 bg-primary/10 border border-primary/20 text-primary rounded-xl text-xs font-semibold space-y-1 select-none animate-fadeIn">
                <p>⚔️ Word Battle Arena Rules:</p>
                <p className="text-muted-foreground font-normal">Players are given the exact same secret word. First player to solve it wins the round.</p>
              </div>
            )}

            {/* Submit */}
            <Button
              onClick={handleCreateRoom}
              disabled={isLoading}
              className="w-full h-13 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-sm shadow-lg shadow-primary/10 transition-all flex items-center justify-center gap-2 mt-2"
            >
              <Gamepad2 className="h-4 w-4" />
              Create Game Room
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function OnlineLobbyPage() {
  return (
    <Suspense fallback={null}>
      <OnlineLobbyPageContent />
    </Suspense>
  );
}
