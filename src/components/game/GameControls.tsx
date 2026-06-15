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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useGameStore } from "@/stores/gameStore";
import type { BoardSize, Difficulty, SeriesMode } from "@/lib/game/types";
import { cn } from "@/lib/utils";

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

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Mode Toggle */}
      <div className="glass rounded-2xl p-3">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            className={cn(
              "flex-1 gap-2 rounded-xl h-11 transition-all",
              mode === "pvp"
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary hover:text-primary-foreground"
                : "hover:bg-muted"
            )}
            onClick={() => setMode("pvp")}
          >
            <Users className="h-4 w-4" />
            Player vs Player
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "flex-1 gap-2 rounded-xl h-11 transition-all",
              mode === "pvai"
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary hover:text-primary-foreground"
                : "hover:bg-muted"
            )}
            onClick={() => setMode("pvai")}
          >
            <Bot className="h-4 w-4" />
            Player vs AI
          </Button>
        </div>
      </div>

      {/* Settings Row */}
      <div className={`grid ${mode === "pvai" ? "grid-cols-3" : "grid-cols-2"} gap-2`}>
        {/* AI Difficulty */}
        {mode === "pvai" && (
          <div className="col-span-1">
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5 block px-1">
              <Zap className="h-3 w-3 inline mr-1" />
              Difficulty
            </label>
            <Select
              value={difficulty}
              onValueChange={(v) => setDifficulty(v as Difficulty)}
            >
              <SelectTrigger className="glass rounded-xl h-10 text-sm">
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
        <div>
          <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5 block px-1">
            <Grid3X3 className="h-3 w-3 inline mr-1" />
            Board
          </label>
          <Select
            value={String(boardSize)}
            onValueChange={(v) => setBoardSize(Number(v) as BoardSize)}
          >
            <SelectTrigger className="glass rounded-xl h-10 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-strong">
              <SelectItem value="3">3 × 3</SelectItem>
              <SelectItem value="4">4 × 4</SelectItem>
              <SelectItem value="5">5 × 5</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Series Mode */}
        <div className="col-span-1">
          <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5 block px-1">
            <Timer className="h-3 w-3 inline mr-1" />
            Series
          </label>
          <Select
            value={String(seriesMode)}
            onValueChange={(v) => setSeriesMode(Number(v) as SeriesMode)}
          >
            <SelectTrigger className="glass rounded-xl h-10 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-strong">
              <SelectItem value="1">Best of 1</SelectItem>
              <SelectItem value="3">Best of 3</SelectItem>
              <SelectItem value="5">Best of 5</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
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
