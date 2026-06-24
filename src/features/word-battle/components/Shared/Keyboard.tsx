import { useEffect } from "react";
import { KeyboardState } from "../../types/word-battle";
import { cn } from "@/shared/services/utils";

interface KeyboardProps {
  onChar: (value: string) => void;
  onDelete: () => void;
  onEnter: () => void;
  statuses: KeyboardState;
}

export function Keyboard({ onChar, onDelete, onEnter, statuses }: KeyboardProps) {
  const rows = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "DELETE"],
  ];

  const handleKeyPress = (key: string) => {
    if (key === "ENTER") {
      onEnter();
    } else if (key === "DELETE" || key === "BACKSPACE") {
      onDelete();
    } else if (/^[A-Z]$/.test(key)) {
      onChar(key);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      handleKeyPress(key);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onChar, onDelete, onEnter]);

  const getKeyClass = (key: string) => {
    const status = statuses[key];
    
    const baseClass = "flex items-center justify-center h-12 sm:h-14 font-extrabold rounded-lg text-xs sm:text-sm select-none transition-all active:scale-95 duration-100 shadow-sm border";

    if (key === "ENTER" || key === "DELETE") {
      return cn(
        baseClass,
        "px-2 sm:px-4 flex-[1.5] bg-card/60 hover:bg-card/90 active:bg-primary/20 border-border/50 text-foreground"
      );
    }

    switch (status) {
      case "correct":
        return cn(baseClass, "flex-1 bg-emerald-500 border-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]");
      case "present":
        return cn(baseClass, "flex-1 bg-amber-500 border-amber-600 text-white shadow-[0_0_10px_rgba(245,158,11,0.3)]");
      case "absent":
        return cn(baseClass, "flex-1 bg-muted-foreground/30 border-transparent text-muted-foreground/60 opacity-60 pointer-events-none");
      default:
        return cn(baseClass, "flex-1 bg-card/60 hover:bg-card/90 border-border/50 text-foreground hover:border-primary/30");
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-2 px-1 py-4 sm:py-6 glass rounded-2xl border border-border/30 shadow-lg">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-1.5 w-full">
          {row.map((key) => (
            <button
              key={key}
              onClick={() => handleKeyPress(key)}
              className={getKeyClass(key)}
              aria-label={key}
            >
              {key === "DELETE" ? "⌫" : key}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
