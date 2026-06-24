// ============================================================
// Game Controls — Mode, Difficulty, Board Size, Series
// ============================================================

"use client";

import {
  Users,
  Bot,
  Grid3X3,
  Undo2,
  Redo2,
  RotateCcw,
  Zap,
  Timer,
  Globe,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Badge } from "@/shared/components/ui/badge";
import { useGameStore } from "@/store/gameStore";
import type { BoardSize, Difficulty, SeriesMode } from "@/shared/types/game";
import { cn } from "@/shared/services/utils";

export function GameControls() {
  const mode = useGameStore((s) => s.mode);
  const difficulty = useGameStore((s) => s.difficulty);
  const boardSize = useGameStore((s) => s.boardSize);
  const seriesMode = useGameStore((s) => s.seriesMode);
  const history = useGameStore((s) => s.history);
  const redoStack = useGameStore((s) => s.redoStack);

  const setMode = useGameStore((s) => s.setMode);
  const setDifficulty = useGameStore((s) => s.setDifficulty);
  const setBoardSize = useGameStore((s) => s.setBoardSize);
  const setSeriesMode = useGameStore((s) => s.setSeriesMode);
  const undo = useGameStore((s) => s.undo);
  const redo = useGameStore((s) => s.redo);
  const resetRound = useGameStore((s) => s.resetRound);
  const router = useRouter();

  return (
    <div className="w-full max-w-[95vw] sm:max-w-md mx-auto space-y-3 sm:space-y-4">
      {/* Mode Toggle */}
      <div className="glass rounded-xl sm:rounded-2xl p-2 sm:p-3">
        <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
          <Button
            variant="ghost"
            className={cn(
              "flex-col sm:flex-row gap-0.5 sm:gap-2 rounded-lg sm:rounded-xl h-12 sm:h-11 transition-all text-[9px] sm:text-xs font-bold px-1 sm:px-1.5",
              mode === "pvp"
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary hover:text-primary-foreground"
                : "hover:bg-muted text-muted-foreground"
            )}
            onClick={() => setMode("pvp")}
          >
            <Users className="h-4 w-4 shrink-0" />
            <span>Local PvP</span>
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "flex-col sm:flex-row gap-0.5 sm:gap-2 rounded-lg sm:rounded-xl h-12 sm:h-11 transition-all text-[9px] sm:text-xs font-bold px-1 sm:px-1.5",
              mode === "pvai"
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary hover:text-primary-foreground"
                : "hover:bg-muted text-muted-foreground"
            )}
            onClick={() => setMode("pvai")}
          >
            <Bot className="h-4 w-4 shrink-0" />
            <span>Vs AI</span>
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "flex-col sm:flex-row gap-0.5 sm:gap-2 rounded-lg sm:rounded-xl h-12 sm:h-11 transition-all text-[9px] sm:text-xs font-bold px-1 sm:px-1.5 hover:bg-muted text-muted-foreground"
            )}
            onClick={() => router.push("/online")}
          >
            <Globe className="h-4 w-4 shrink-0" />
            <span>Online</span>
          </Button>
        </div>
      </div>

      {/* Settings Row */}
      <div className={cn(
        "grid gap-2 sm:gap-2.5",
        mode === "pvai" ? "grid-cols-2" : "grid-cols-1"
      )}>
        {/* AI Difficulty */}
        {mode === "pvai" && (
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium block px-1">
              <Zap className="h-3 w-3 inline mr-1 text-primary" />
              Difficulty
            </label>
            <Select
              value={difficulty}
              onValueChange={(v) => setDifficulty(v as Difficulty)}
            >
              <SelectTrigger className="glass rounded-xl h-11 sm:h-10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-strong">
                <SelectItem value="easy">
                  Easy
                  <Badge variant="secondary" className="ml-2 text-[10px]">
                    Random
                  </Badge>
                </SelectItem>
                <SelectItem value="medium">
                  Medium
                  <Badge variant="secondary" className="ml-2 text-[10px]">
                    Heuristic
                  </Badge>
                </SelectItem>
                <SelectItem value="hard">
                  Hard
                  <Badge variant="secondary" className="ml-2 text-[10px]">
                    Minimax
                  </Badge>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Board Size */}
        <div className="space-y-1.5">
          <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium block px-1">
            <Grid3X3 className="h-3 w-3 inline mr-1 text-primary" />
            Board Size
          </label>
          <Select
            value={String(boardSize)}
            onValueChange={(v) => setBoardSize(Number(v) as BoardSize)}
          >
            <SelectTrigger className="glass rounded-xl h-11 sm:h-10 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-strong">
              <SelectItem value="3">3 × 3</SelectItem>
              <SelectItem value="4">4 × 4</SelectItem>
              <SelectItem value="5">5 × 5</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Series Selection (Best-of 1, 3, 5 buttons) */}
      <div className="space-y-2">
        <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5 px-1">
          <Timer className="h-3.5 w-3.5 text-primary" />
          Series Rule
        </label>
        <div className="flex flex-row sm:flex-row gap-1.5 sm:gap-2">
          {([1, 3, 5] as SeriesMode[]).map((m) => {
            const isSelected = seriesMode === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setSeriesMode(m)}
                className={cn(
                  "flex-1 h-11 sm:h-10 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-xs border transition-all flex items-center justify-center gap-1 sm:gap-1.5",
                  isSelected
                    ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary hover:text-primary-foreground"
                    : "bg-card/40 border-border/60 text-muted-foreground hover:bg-card/60 hover:text-foreground"
                )}
              >
                <span>{m === 1 ? "Single Match" : `Best of ${m}`}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-1.5 sm:gap-2">
        <Button
          variant="outline"
          size="sm"
          className="glass rounded-xl gap-1.5 flex-1"
          onClick={undo}
          disabled={history.length === 0}
        >
          <Undo2 className="h-3.5 w-3.5" />
          Undo
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="glass rounded-xl gap-1.5 flex-1"
          onClick={redo}
          disabled={redoStack.length === 0}
        >
          <Redo2 className="h-3.5 w-3.5" />
          Redo
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="glass rounded-xl gap-1.5 flex-1"
          onClick={resetRound}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </Button>
      </div>
    </div>
  );
}
