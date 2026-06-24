"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Swords, BarChart3 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { DifficultyPicker } from "../Shared/DifficultyPicker";
import { SoloGame } from "./SoloGame";
import { useWordBattle } from "../../hooks/useWordBattle";
import { WordDifficulty } from "../../types/word-battle";

export function SoloModeArena() {
  const { difficulty, status, stats, startSoloGame, resetSoloStats } = useWordBattle();
  const [selectedDifficulty, setSelectedDifficulty] = useState<WordDifficulty>(difficulty);

  const isPlaying = status === "playing" || status === "victory" || status === "defeat";

  const handleStart = () => {
    startSoloGame(selectedDifficulty);
  };

  if (isPlaying) {
    return (
      <div className="w-full">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-3">
            <Swords className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Solo Mode — {selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">6 attempts to guess the word</p>
        </div>
        <SoloGame />
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
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
          <Swords className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Solo Mode</span>
        </div>
        <h2 className="text-2xl font-black tracking-tight mt-2">Wordle Challenge</h2>
        <p className="text-sm text-muted-foreground">Guess the hidden word in 6 attempts</p>
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
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Stats — {selectedDifficulty}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: "Played", value: stats.played },
            { label: "Wins", value: stats.won },
            { label: "Streak", value: stats.currentStreak },
          ].map(({ label, value }) => (
            <div key={label} className="space-y-0.5">
              <div className="text-2xl font-black text-foreground">{value}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
        {stats.played > 0 && (
          <div className="pt-1 border-t border-border/30">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Win Rate</span>
              <span className="font-bold text-foreground">
                {Math.round((stats.won / stats.played) * 100)}%
              </span>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(stats.won / Math.max(stats.played, 1)) * 100}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2.5">
        <Button
          size="lg"
          onClick={handleStart}
          className="w-full h-13 rounded-2xl font-extrabold text-base bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
        >
          Start Game
        </Button>
        {stats.played > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetSoloStats}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            Reset Stats
          </Button>
        )}
      </div>
    </motion.div>
  );
}
