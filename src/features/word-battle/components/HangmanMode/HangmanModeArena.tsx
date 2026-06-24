"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, BarChart3 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { DifficultyPicker } from "../Shared/DifficultyPicker";
import { HangmanGame } from "./HangmanGame";
import { useHangman } from "../../hooks/useHangman";
import { WordDifficulty } from "../../types/word-battle";

export function HangmanModeArena() {
  const { difficulty, status, stats, startGame, resetHangmanStats } = useHangman();
  const [selectedDifficulty, setSelectedDifficulty] = useState<WordDifficulty>(difficulty);

  const isPlaying = status === "playing" || status === "victory" || status === "defeat";

  const handleStart = () => {
    startGame(selectedDifficulty);
  };

  if (isPlaying) {
    return (
      <div className="w-full">
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 mb-3">
            <Brain className="h-3.5 w-3.5 text-violet-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-violet-400">
              Hangman — {selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Guess the word before the hangman is complete</p>
        </div>
        <HangmanGame />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md mx-auto space-y-5"
    >
      {/* Title */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20">
          <Brain className="h-3.5 w-3.5 text-violet-400" />
          <span className="text-xs font-bold uppercase tracking-widest text-violet-400">Hangman Mode</span>
        </div>
        <h2 className="text-2xl font-black tracking-tight mt-2">Word Hangman</h2>
        <p className="text-sm text-muted-foreground">Guess the word letter by letter — 6 chances</p>
      </div>

      {/* Difficulty Picker */}
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold px-1">
          Select Difficulty
        </label>
        <DifficultyPicker value={selectedDifficulty} onChange={setSelectedDifficulty} />
      </div>

      {/* Stats */}
      <div className="glass rounded-2xl border border-border/30 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-violet-400" />
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Stats — {selectedDifficulty}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: "Played", value: stats.played },
            { label: "Wins", value: stats.won },
            { label: "Losses", value: stats.lost },
          ].map(({ label, value }) => (
            <div key={label} className="space-y-0.5">
              <div className="text-2xl font-black text-foreground">{value}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2.5">
        <Button
          size="lg"
          onClick={handleStart}
          className="w-full h-13 rounded-2xl font-extrabold text-base bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-violet-500/20 transition-all hover:scale-[1.02]"
        >
          Start Hangman
        </Button>
        {stats.played > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetHangmanStats}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            Reset Stats
          </Button>
        )}
      </div>
    </motion.div>
  );
}
