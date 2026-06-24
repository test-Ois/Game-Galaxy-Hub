"use client";

import { motion } from "framer-motion";
import { Trophy, RotateCcw, Home, XCircle } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { ConfettiEffect } from "./ConfettiEffect";
import { cn } from "@/shared/services/utils";

interface ResultScreenProps {
  status: "victory" | "defeat";
  secretWord: string;
  attempts?: number;
  maxAttempts?: number;
  onPlayAgain: () => void;
  onHome: () => void;
  message?: string;
}

export function ResultScreen({
  status,
  secretWord,
  attempts,
  maxAttempts,
  onPlayAgain,
  onHome,
  message,
}: ResultScreenProps) {
  const isWin = status === "victory";

  return (
    <>
      <ConfettiEffect trigger={isWin} />

      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-background/70 backdrop-blur-md"
      >
        <div
          className={cn(
            "relative w-full max-w-sm rounded-3xl border overflow-hidden",
            "glass shadow-2xl",
            isWin
              ? "border-emerald-500/40 shadow-emerald-500/20"
              : "border-rose-500/30 shadow-rose-500/10"
          )}
        >
          {/* Top gradient banner */}
          <div
            className={cn(
              "h-2 w-full",
              isWin
                ? "bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500"
                : "bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600"
            )}
          />

          <div className="p-6 sm:p-8 flex flex-col items-center gap-5 text-center">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", delay: 0.1, stiffness: 260, damping: 20 }}
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center",
                isWin
                  ? "bg-emerald-500/20 border-2 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.4)]"
                  : "bg-rose-500/20 border-2 border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.3)]"
              )}
            >
              {isWin ? (
                <Trophy className="h-9 w-9 text-emerald-400" />
              ) : (
                <XCircle className="h-9 w-9 text-rose-400" />
              )}
            </motion.div>

            {/* Title */}
            <div className="space-y-1.5">
              <h2
                className={cn(
                  "text-3xl font-black tracking-tight",
                  isWin ? "text-emerald-400" : "text-rose-400"
                )}
              >
                {isWin ? "You Won!" : "Game Over"}
              </h2>
              {message && (
                <p className="text-sm text-muted-foreground">{message}</p>
              )}
            </div>

            {/* The Word Reveal */}
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                {isWin ? "The word was" : "Answer was"}
              </p>
              <div className="flex gap-1.5">
                {secretWord.split("").map((char, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.06 }}
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black text-white border",
                      isWin
                        ? "bg-emerald-500/80 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                        : "bg-rose-500/70 border-rose-500"
                    )}
                  >
                    {char}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Attempts */}
            {isWin && attempts !== undefined && maxAttempts !== undefined && (
              <p className="text-sm text-muted-foreground">
                Solved in{" "}
                <span className="font-bold text-foreground">
                  {attempts} / {maxAttempts}
                </span>{" "}
                attempts
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-3 w-full mt-1">
              <Button
                variant="outline"
                size="lg"
                onClick={onHome}
                className="flex-1 glass rounded-xl gap-2"
              >
                <Home className="h-4 w-4" />
                Home
              </Button>
              <Button
                size="lg"
                onClick={onPlayAgain}
                className={cn(
                  "flex-1 rounded-xl gap-2 font-bold",
                  isWin
                    ? "bg-emerald-500 hover:bg-emerald-400 text-white"
                    : "bg-primary hover:bg-primary/90 text-primary-foreground"
                )}
              >
                <RotateCcw className="h-4 w-4" />
                Play Again
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
