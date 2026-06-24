"use client";

import { motion } from "framer-motion";
import { Trophy, Minus, XCircle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { ConfettiEffect } from "../Shared/ConfettiEffect";
import { useWordBattleStore } from "../../store/wordBattleStore";
import { useWordBattleSocket } from "../../hooks/useWordBattleSocket";
import { cn } from "@/shared/services/utils";
import { useRouter } from "next/navigation";

interface MultiplayerResultProps {
  playerId: string;
}

export function MultiplayerResult({ playerId }: MultiplayerResultProps) {
  const room = useWordBattleStore((s) => s.multiplayerRoom);
  const setMultiplayerRoom = useWordBattleStore((s) => s.setMultiplayerRoom);
  const { requestPlayAgain, leaveRoom } = useWordBattleSocket();
  const router = useRouter();

  if (!room) return null;

  const isDraw = room.draw;
  const isWinner = !isDraw && room.winnerId === playerId;
  const isLoser = !isDraw && room.winnerId !== null && room.winnerId !== playerId;

  const myScore = room.scores?.[playerId] ?? 0;
  const opponentId = room.players.find((p) => p.playerId !== playerId)?.playerId;
  const opponentName = room.players.find((p) => p.playerId !== playerId)?.name ?? "Opponent";
  const opponentScore = opponentId ? (room.scores?.[opponentId] ?? 0) : 0;

  const myRematchPending = room.rematchRequests?.includes(playerId);
  const opponentRematchPending = opponentId && room.rematchRequests?.includes(opponentId);

  const handleHome = () => {
    leaveRoom();
    router.push("/play/wordbattle");
  };

  const resultConfig = isDraw
    ? {
        icon: <Minus className="h-10 w-10 text-amber-400" />,
        bg: "bg-amber-500/20 border-amber-500/40",
        shadow: "shadow-amber-500/20",
        title: "It's a Draw!",
        subtitle: "Both players failed to guess the word.",
        titleColor: "text-amber-400",
      }
    : isWinner
    ? {
        icon: <Trophy className="h-10 w-10 text-emerald-400" />,
        bg: "bg-emerald-500/20 border-emerald-500/40",
        shadow: "shadow-emerald-500/20",
        title: "You Win!",
        subtitle: "You solved the word first. Outstanding!",
        titleColor: "text-emerald-400",
      }
    : {
        icon: <XCircle className="h-10 w-10 text-rose-400" />,
        bg: "bg-rose-500/20 border-rose-500/40",
        shadow: "shadow-rose-500/20",
        title: "You Lose",
        subtitle: `${opponentName} solved it faster.`,
        titleColor: "text-rose-400",
      };

  return (
    <>
      <ConfettiEffect trigger={isWinner} />

      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-background/70 backdrop-blur-md"
      >
        <div
          className={cn(
            "w-full max-w-sm rounded-3xl border overflow-hidden glass shadow-2xl",
            resultConfig.bg,
            resultConfig.shadow
          )}
        >
          {/* Top gradient */}
          <div
            className={cn(
              "h-1.5 w-full",
              isWinner
                ? "bg-gradient-to-r from-emerald-400 to-teal-400"
                : isDraw
                ? "bg-gradient-to-r from-amber-400 to-yellow-400"
                : "bg-gradient-to-r from-rose-500 to-pink-500"
            )}
          />

          <div className="p-6 flex flex-col items-center gap-5 text-center">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", delay: 0.1, stiffness: 260, damping: 20 }}
              className={cn("w-20 h-20 rounded-full flex items-center justify-center border-2", resultConfig.bg)}
            >
              {resultConfig.icon}
            </motion.div>

            {/* Title */}
            <div className="space-y-1">
              <h2 className={cn("text-3xl font-black tracking-tight", resultConfig.titleColor)}>
                {resultConfig.title}
              </h2>
              <p className="text-sm text-muted-foreground">{resultConfig.subtitle}</p>
            </div>

            {/* The secret word */}
            {room.secretWord && (
              <div className="space-y-1.5">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                  The word was
                </p>
                <div className="flex gap-1.5 justify-center">
                  {room.secretWord.split("").map((char, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.06 }}
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-base font-black text-white bg-primary/80 border border-primary"
                    >
                      {char}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Scores */}
            <div className="flex gap-4 w-full px-2">
              <div className="flex-1 glass rounded-xl py-3 border border-border/30">
                <div className="text-2xl font-black">{myScore}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">You</div>
              </div>
              <div className="flex items-center text-lg font-black text-muted-foreground">vs</div>
              <div className="flex-1 glass rounded-xl py-3 border border-border/30">
                <div className="text-2xl font-black">{opponentScore}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground truncate px-1">
                  {opponentName}
                </div>
              </div>
            </div>

            {/* Rematch info */}
            {myRematchPending && !opponentRematchPending && (
              <p className="text-xs text-muted-foreground animate-pulse">
                Waiting for opponent to accept rematch...
              </p>
            )}
            {opponentRematchPending && !myRematchPending && (
              <p className="text-xs text-amber-400 font-semibold">
                Opponent wants a rematch!
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                size="lg"
                onClick={handleHome}
                className="flex-1 glass rounded-xl gap-2"
              >
                <Home className="h-4 w-4" />
                Home
              </Button>
              <Button
                size="lg"
                onClick={requestPlayAgain}
                disabled={myRematchPending}
                className={cn(
                  "flex-1 rounded-xl gap-2 font-bold",
                  myRematchPending
                    ? "opacity-60 cursor-wait"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground"
                )}
              >
                <RotateCcw className="h-4 w-4" />
                {myRematchPending ? "Waiting..." : "Rematch"}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
