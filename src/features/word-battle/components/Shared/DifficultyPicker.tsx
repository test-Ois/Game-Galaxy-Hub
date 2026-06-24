"use client";

import { cn } from "@/shared/services/utils";
import { WordDifficulty } from "../../types/word-battle";

interface DifficultyPickerProps {
  value: WordDifficulty;
  onChange: (difficulty: WordDifficulty) => void;
  className?: string;
}

const DIFFICULTIES: { value: WordDifficulty; label: string; sub: string }[] = [
  { value: "easy", label: "Easy", sub: "4 letters" },
  { value: "medium", label: "Medium", sub: "5 letters" },
  { value: "hard", label: "Hard", sub: "6–8 letters" },
];

const ACTIVE_STYLES: Record<WordDifficulty, string> = {
  easy: "bg-emerald-500 border-emerald-400 text-white shadow-emerald-500/30 shadow-lg",
  medium: "bg-amber-500 border-amber-400 text-white shadow-amber-500/30 shadow-lg",
  hard: "bg-rose-500 border-rose-400 text-white shadow-rose-500/30 shadow-lg",
};

export function DifficultyPicker({ value, onChange, className }: DifficultyPickerProps) {
  return (
    <div className={cn("flex gap-2 sm:gap-3", className)}>
      {DIFFICULTIES.map(({ value: diff, label, sub }) => {
        const isActive = value === diff;
        return (
          <button
            key={diff}
            type="button"
            onClick={() => onChange(diff)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 py-3 px-2 rounded-xl border font-bold transition-all duration-200 select-none",
              isActive
                ? ACTIVE_STYLES[diff]
                : "bg-card/40 border-border/50 text-muted-foreground hover:bg-card/70 hover:text-foreground hover:border-border/80"
            )}
          >
            <span className="text-sm sm:text-base font-extrabold">{label}</span>
            <span className={cn("text-[10px] sm:text-xs font-medium opacity-80")}>{sub}</span>
          </button>
        );
      })}
    </div>
  );
}
