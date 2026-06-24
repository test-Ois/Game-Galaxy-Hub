// ============================================================
// Word Battle Multiplayer Arena — Real-Time Socket.IO Game
// ============================================================

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Copy, Share2, RefreshCw, CheckCircle2, AlertCircle,
  Users, LogOut, Trophy, Swords
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { useWordBattleSocket } from "../../hooks/useWordBattleSocket";
import { useWordBattleStore } from "../../store/wordBattleStore";
import { Keyboard } from "../Shared/Keyboard";
import { LetterInfo, WordDifficulty } from "../../types/word-battle";
import { cn } from "@/shared/services/utils";
import { useSound } from "@/shared/hooks/useSound";

// ─── Re-use evaluate helper ───
function evaluateGuess(guess: string, secret: string): LetterInfo[] {
  const result: LetterInfo[] = Array(secret.length).fill(null).map((_, i) => ({
    char: guess[i] || "",
    state: "absent" as const,
  }));
  const secretCounts: Record<string, number> = {};
  for (const c of secret) secretCounts[c] = (secretCounts[c] || 0) + 1;
  for (let i = 0; i < secret.length; i++) {
    if (guess[i] === secret[i]) {
      result[i] = { char: guess[i], state: "correct" };
      secretCounts[guess[i]]--;
    }
  }
  for (let i = 0; i < secret.length; i++) {
    if (result[i].state === "correct") continue;
    const char = guess[i];
    if (char && secretCounts[char] && secretCounts[char] > 0) {
      result[i] = { char, state: "present" };
      secretCounts[char]--;
    } else {
      result[i] = { char: char || "", state: result[i].state };
    }
  }
  return result;
}

// ─── Mini Row (for grid display) ───
function MiniTile({ info, isRevealed }: { info?: LetterInfo; isRevealed?: boolean }) {
  const baseClass = "w-full aspect-square flex items-center justify-center rounded-lg font-black text-sm border select-none transition-all";
  if (!info || info.state === "empty") return <div className={cn(baseClass, "border-border/30 bg-card/20")} />;

  let colorClass = "border-border/30 bg-card/20";
  if (isRevealed) {
    switch (info.state) {
      case "correct": colorClass = "bg-emerald-500 border-emerald-600 text-white"; break;
      case "present": colorClass = "bg-amber-500 border-amber-600 text-white"; break;
      case "absent": colorClass = "bg-muted border-muted-foreground/20 text-muted-foreground"; break;
    }
  } else {
    colorClass = "border-primary/30 bg-primary/10 text-foreground";
  }

  return (
    <motion.div
      initial={isRevealed ? { rotateX: 0 } : undefined}
      animate={isRevealed ? { rotateX: [0, -90, 0] } : undefined}
      transition={isRevealed ? { duration: 0.4, ease: "easeInOut" } : undefined}
      className={cn(baseClass, colorClass)}
    >
      {info.char}
    </motion.div>
  );
}

function GuessGrid({
  guesses,
  currentGuess,
  secretWord,
  maxAttempts,
  shakeRow,
}: {
  guesses: string[];
  currentGuess: string;
  secretWord: string;
  maxAttempts: number;
  shakeRow: number | null;
}) {
  const wordLen = secretWord.length;
  return (
    <div className="space-y-1.5 w-full">
      {Array.from({ length: maxAttempts }).map((_, rowIdx) => {
        const submitted = guesses[rowIdx];
        const isCurrent = rowIdx === guesses.length;
        const evaluated = submitted ? evaluateGuess(submitted, secretWord) : null;

        return (
          <motion.div
            key={rowIdx}
            animate={shakeRow === rowIdx ? { x: [-6, 6, -6, 6, 0] } : {}}
            transition={{ duration: 0.35 }}
            className="grid gap-1.5"
            style={{ gridTemplateColumns: `repeat(${wordLen}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: wordLen }).map((_, ci) => {
              if (submitted && evaluated) {
                return <MiniTile key={ci} info={evaluated[ci]} isRevealed />;
              }
              if (isCurrent) {
                const char = currentGuess[ci] || "";
                return <MiniTile key={ci} info={{ char, state: char ? "tbd" : "empty" }} />;
              }
              return <MiniTile key={ci} />;
            })}
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Opponent Progress Bar ───
function OpponentProgress({ attemptsUsed, maxAttempts, solved, failed, opponentName }: {
  attemptsUsed: number;
  maxAttempts: number;
  solved: boolean;
  failed: boolean;
  opponentName: string;
}) {
  const pct = Math.min((attemptsUsed / maxAttempts) * 100, 100);
  return (
    <div className="glass rounded-xl p-3 border border-border/30 space-y-2">
      <div className="flex items-center justify-between text-xs font-bold">
        <span className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-500 to-emerald-500 flex items-center justify-center text-white font-black text-[10px]">
            {opponentName.charAt(0).toUpperCase()}
          </div>
          <span className="truncate max-w-[100px]">{opponentName}</span>
        </span>
        <span className={cn("text-[10px] font-black uppercase tracking-wide",
          solved ? "text-emerald-500" : failed ? "text-rose-500" : "text-muted-foreground"
        )}>
          {solved ? "✓ SOLVED" : failed ? "✗ FAILED" : `${attemptsUsed}/${maxAttempts} tries`}
        </span>
      </div>
      <div className="h-2 bg-muted/40 rounded-full overflow-hidden">
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4 }}
          className={cn("h-full rounded-full",
            solved ? "bg-emerald-500" : failed ? "bg-rose-500" : "bg-amber-500"
          )}
        />
      </div>
    </div>
  );
}

// ─── Waiting Lobby ───
function WaitingLobby({
  roomId,
  myName,
  onLeave,
}: {
  roomId: string;
  myName: string;
  onLeave: () => void;
}) {
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const inviteLink = typeof window !== "undefined"
    ? `${window.location.origin}/play/wordbattle/${roomId}`
    : `https://game-galaxy-hub.com/play/wordbattle/${roomId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(roomId);
    showToast("Room ID copied!");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    showToast("Invite link copied!");
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`Join my Word Battle room: ${inviteLink}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div className="relative min-h-[calc(100vh-5rem)] flex items-center justify-center px-3 sm:px-4 py-6 pt-16">
      <div className="absolute top-4 left-4">
        <Button onClick={onLeave} variant="ghost" size="icon" className="w-11 h-11 rounded-full glass hover:bg-accent" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-5"
      >
        <div className="text-center space-y-1">
          <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest">
            ⚔️ Word Battle Arena
          </Badge>
          <h1 className="text-2xl font-black">Waiting Room</h1>
          <p className="text-xs text-muted-foreground">Share your Room ID to invite a friend</p>
        </div>

        {/* Player Slots */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass rounded-2xl p-4 flex flex-col items-center gap-3 border border-border/40">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-600 flex items-center justify-center font-black text-white text-xl border-2 border-primary/30">
              {myName.charAt(0).toUpperCase()}
            </div>
            <div className="text-center">
              <p className="font-bold text-xs truncate max-w-[80px]">{myName} (You)</p>
              <Badge className="mt-1 bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px]">HOST</Badge>
            </div>
            <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Ready
            </span>
          </div>

          <div className="glass rounded-2xl p-4 flex flex-col items-center gap-3 border border-dashed border-border/60">
            <div className="w-14 h-14 rounded-full bg-muted/40 flex items-center justify-center border border-dashed border-border animate-pulse">
              <Users className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <div className="text-center">
              <p className="font-bold text-xs text-muted-foreground animate-pulse">Waiting...</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">Player 2 slot</p>
            </div>
          </div>
        </div>

        {/* Room ID + Share */}
        <div className="glass rounded-2xl p-4 sm:p-5 space-y-3 border border-border/40">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest block">Room ID</span>
              <span className="font-mono text-2xl font-black text-primary tracking-widest">{roomId}</span>
            </div>
            <Button onClick={handleCopy} variant="outline" className="h-10 px-3 rounded-xl text-xs font-bold border-border/50 gap-1.5">
              <Copy className="h-3.5 w-3.5" />
              Copy
            </Button>
          </div>
          <hr className="border-border/30" />
          <div className="flex gap-2">
            <Button onClick={handleWhatsApp} className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs">
              📲 WhatsApp
            </Button>
            <Button onClick={handleCopyLink} className="flex-1 h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs gap-1.5">
              <Share2 className="h-3.5 w-3.5" />
              Copy Link
            </Button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-full bg-foreground text-background text-xs font-extrabold shadow-xl"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Multiplayer Arena ───
export function MultiplayerArena() {
  const router = useRouter();
  const { roomId } = useParams() as { roomId: string };
  const { playClick, playError } = useSound();

  const {
    connect, submitGuess, sendProgress, requestPlayAgain, leaveRoom, rejoinRoom, socket, playerId
  } = useWordBattleSocket();

  const room = useWordBattleStore((s) => s.multiplayerRoom);
  const playerName = useWordBattleStore((s) => s.multiplayerPlayerName) || "Guest";

  // Local game state
  const [localGuesses, setLocalGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [shakeRow, setShakeRow] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [confettiFired, setConfettiFired] = useState(false);

  const secretWord = room?.secretWord || "";
  const maxAttempts = 6;
  const myProgress = room?.playerProgress?.[playerId || ""];
  const opponentEntry = room?.players.find((p) => p.playerId !== playerId);
  const opponentProgress = opponentEntry ? room?.playerProgress?.[opponentEntry.playerId] : undefined;
  const mePlayer = room?.players.find((p) => p.playerId === playerId);

  const isPlaying = room?.status === "playing";
  const isFinished = room?.status === "finished";
  const iSolved = myProgress?.solved || false;
  const iFailed = myProgress?.failed || false;
  const myDone = iSolved || iFailed;

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  // Connect and rejoin on mount
  useEffect(() => {
    connect();
    rejoinRoom(roomId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // Sync server-confirmed guesses back to local state
  useEffect(() => {
    if (myProgress?.guesses) {
      setLocalGuesses(myProgress.guesses);
      setCurrentGuess("");
    }
  }, [myProgress?.guesses]);

  // Confetti on win
  useEffect(() => {
    if (isFinished && room?.winnerId === playerId && !confettiFired) {
      setConfettiFired(true);
      import("canvas-confetti").then((m) => {
        const confetti = m.default;
        const end = Date.now() + 2500;
        const interval = setInterval(() => {
          if (Date.now() > end) return clearInterval(interval);
          confetti({ particleCount: 50, spread: 360, startVelocity: 28, ticks: 50, zIndex: 100, origin: { x: Math.random(), y: Math.random() - 0.2 } });
        }, 200);
      });
    }
  }, [isFinished, room?.winnerId, playerId, confettiFired]);

  // Pop-state (browser back) interception
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handler = () => {
      window.history.pushState(null, "", window.location.href);
      setShowExitModal(true);
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  // Keyboard handlers
  const onChar = useCallback((char: string) => {
    if (!isPlaying || myDone) return;
    if (currentGuess.length >= secretWord.length) return;
    setCurrentGuess((prev) => prev + char);
  }, [isPlaying, myDone, currentGuess.length, secretWord.length]);

  const onDelete = useCallback(() => {
    if (!isPlaying || myDone) return;
    setCurrentGuess((prev) => prev.slice(0, -1));
  }, [isPlaying, myDone]);

  const onEnter = useCallback(() => {
    if (!isPlaying || myDone) return;
    if (currentGuess.length !== secretWord.length) {
      const rowIdx = localGuesses.length;
      setShakeRow(rowIdx);
      setTimeout(() => setShakeRow(null), 450);
      showToast("Not enough letters");
      return;
    }
    // Send to server
    submitGuess(currentGuess);
    sendProgress(localGuesses.length + 1);
    setCurrentGuess("");
  }, [isPlaying, myDone, currentGuess, secretWord.length, localGuesses.length, submitGuess, sendProgress, showToast]);

  // Keyboard state (color-coding based on local guesses)
  const keyboardStatuses = useCallback(() => {
    const statuses: Record<string, "correct" | "present" | "absent" | "unused"> = {};
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach((l) => (statuses[l] = "unused"));
    localGuesses.forEach((guess) => {
      for (let i = 0; i < guess.length; i++) {
        const char = guess[i];
        if (char === secretWord[i]) {
          statuses[char] = "correct";
        } else if (secretWord.includes(char) && statuses[char] !== "correct") {
          statuses[char] = "present";
        } else if (statuses[char] !== "correct" && statuses[char] !== "present") {
          statuses[char] = "absent";
        }
      }
    });
    return statuses;
  }, [localGuesses, secretWord]);

  const handleLeave = useCallback(() => {
    playClick();
    leaveRoom();
    router.push("/online?game=wordbattle");
  }, [playClick, leaveRoom, router]);

  // ─── LOBBY STATE ───
  if (!room || room.status === "waiting") {
    return (
      <WaitingLobby
        roomId={roomId}
        myName={playerName}
        onLeave={() => {
          leaveRoom();
          router.push("/online?game=wordbattle");
        }}
      />
    );
  }

  // ─── FINISHED STATE ───
  if (isFinished) {
    const iWon = room.winnerId === playerId;
    const isDraw = room.draw;
    const winnerName = room.players.find((p) => p.playerId === room.winnerId)?.name || "Player";
    const iRequestedRematch = room.rematchRequests?.includes(playerId || "");

    return (
      <div className="relative min-h-[calc(100vh-5rem)] flex items-center justify-center px-3 sm:px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm space-y-5 text-center"
        >
          <div className={cn(
            "rounded-3xl p-7 border shadow-2xl space-y-4",
            iWon ? "bg-emerald-500/10 border-emerald-500/30" : isDraw ? "bg-amber-500/10 border-amber-500/30" : "bg-rose-500/10 border-rose-500/30"
          )}>
            <div className="text-5xl">{iWon ? "🏆" : isDraw ? "🤝" : "💀"}</div>
            <div className="space-y-1">
              <h2 className="text-2xl font-black">
                {iWon ? "Victory!" : isDraw ? "It's a Draw!" : "Defeated!"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {iWon ? `You solved the word first!` : isDraw ? "Neither player solved it in time" : `${winnerName} solved it first`}
              </p>
              <p className="text-sm font-bold mt-2">
                Word: <span className="text-primary font-black">{secretWord}</span>
              </p>
            </div>

            {/* Score recap */}
            <div className="flex justify-center gap-6 pt-1">
              {room.players.map((p) => (
                <div key={p.playerId} className="text-center">
                  <div className="text-xl font-black">{room.scores?.[p.playerId] ?? 0}</div>
                  <div className="text-[10px] text-muted-foreground font-semibold truncate max-w-[60px]">{p.name}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Button
              onClick={() => { playClick(); requestPlayAgain(); }}
              disabled={iRequestedRematch}
              className="w-full h-12 rounded-2xl font-bold gap-2 bg-primary hover:bg-primary/90"
            >
              <RefreshCw className="h-4 w-4" />
              {iRequestedRematch ? "Waiting for opponent..." : "Play Again"}
            </Button>
            <Button
              onClick={handleLeave}
              variant="outline"
              className="w-full h-12 rounded-2xl font-bold border-border/50 gap-2"
            >
              <LogOut className="h-4 w-4" />
              Leave Arena
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── PLAYING STATE ───
  return (
    <div className="relative min-h-[calc(100vh-5rem)] flex flex-col items-center px-2 sm:px-4 py-4 pt-16">
      {/* Back / Exit */}
      <div className="absolute top-4 left-4 z-40">
        <Button onClick={() => setShowExitModal(true)} variant="ghost" size="icon" className="w-11 h-11 rounded-full glass hover:bg-accent" aria-label="Exit">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="w-full max-w-md flex flex-col items-center gap-4">
        {/* Room Banner */}
        <div className="glass rounded-xl px-4 py-2.5 border border-border/40 flex items-center justify-between w-full">
          <div>
            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest block">Room ID</span>
            <span className="font-mono text-base font-extrabold text-primary tracking-widest">{roomId}</span>
          </div>
          <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/20 text-emerald-500 text-[10px]">
            <Swords className="h-3 w-3 mr-1" /> Live Match
          </Badge>
        </div>

        {/* Player vs Opponent Header */}
        <div className="grid grid-cols-2 gap-3 w-full">
          <div className="glass rounded-xl p-3 border border-border/40 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs flex-shrink-0">
              {playerName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-[11px] truncate">{playerName} (You)</p>
              {iSolved && <span className="text-[10px] text-emerald-500 font-bold">✓ SOLVED!</span>}
              {iFailed && <span className="text-[10px] text-rose-500 font-bold">✗ Failed</span>}
            </div>
          </div>
          <div className="glass rounded-xl p-3 border border-border/40 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-emerald-600 flex items-center justify-center text-white font-black text-xs flex-shrink-0">
              {opponentEntry ? opponentEntry.name.charAt(0).toUpperCase() : "?"}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-[11px] truncate">{opponentEntry?.name || "Opponent"}</p>
              <span className={cn("text-[10px] font-bold", opponentEntry?.isConnected ? "text-emerald-500" : "text-amber-500")}>
                {opponentEntry?.isConnected ? "● Online" : "⚠ Reconnecting"}
              </span>
            </div>
          </div>
        </div>

        {/* Opponent Progress */}
        {opponentEntry && (
          <div className="w-full">
            <OpponentProgress
              attemptsUsed={opponentProgress?.attemptsUsed ?? 0}
              maxAttempts={maxAttempts}
              solved={opponentProgress?.solved ?? false}
              failed={opponentProgress?.failed ?? false}
              opponentName={opponentEntry.name}
            />
          </div>
        )}

        {/* My Guess Grid */}
        <div className="w-full glass rounded-2xl p-4 border border-border/30">
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-3">Your Board</p>
          <GuessGrid
            guesses={localGuesses}
            currentGuess={currentGuess}
            secretWord={secretWord}
            maxAttempts={maxAttempts}
            shakeRow={shakeRow}
          />
        </div>

        {/* Keyboard */}
        {!myDone && (
          <div className="w-full">
            <Keyboard onChar={onChar} onDelete={onDelete} onEnter={onEnter} statuses={keyboardStatuses()} />
          </div>
        )}

        {/* Done banner (waiting for opponent) */}
        {myDone && !isFinished && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "w-full text-center rounded-2xl p-4 border font-bold text-sm",
              iSolved ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" : "bg-rose-500/10 border-rose-500/30 text-rose-500"
            )}
          >
            {iSolved ? "✓ Word solved! Waiting for opponent..." : `✗ The word was "${secretWord}". Waiting for opponent...`}
          </motion.div>
        )}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-foreground text-background text-xs font-extrabold shadow-xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exit Confirm Modal */}
      <AnimatePresence>
        {showExitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowExitModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative glass-strong rounded-3xl p-6 border border-white/10 w-full max-w-xs text-center space-y-4 shadow-2xl"
            >
              <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />
              <h3 className="text-lg font-black">Exit Match?</h3>
              <p className="text-sm text-muted-foreground">This will forfeit the current game and your opponent will win.</p>
              <div className="flex gap-2">
                <Button onClick={() => setShowExitModal(false)} variant="outline" className="flex-1 h-11 rounded-xl font-bold border-border/50">
                  Stay
                </Button>
                <Button onClick={handleLeave} className="flex-1 h-11 rounded-xl font-bold bg-rose-500 hover:bg-rose-600 text-white">
                  Exit
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
