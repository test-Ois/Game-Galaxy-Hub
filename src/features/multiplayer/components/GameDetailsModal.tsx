"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Globe, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { GameConfig } from "@/shared/config/gameConfig";
import { Button } from "@/shared/components/ui/button";

interface GameDetailsModalProps {
  game: GameConfig | null;
  isOpen: boolean;
  onClose: () => void;
}

export function GameDetailsModal({ game, isOpen, onClose }: GameDetailsModalProps) {
  const router = useRouter();

  if (!game) return null;

  const handleModeClick = (mode: "offline" | "online") => {
    onClose();
    if (mode === "offline") {
      router.push(game.offlinePath);
    } else {
      router.push(game.onlinePath);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Dialog Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="relative w-full max-w-lg bg-background/95 glass-strong border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden"
          >
            {/* Header background glow */}
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-48 h-16 bg-gradient-to-b ${game.gradient} opacity-20 blur-2xl pointer-events-none`} />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 h-10 w-10 rounded-full flex items-center justify-center hover:bg-white/5 active:scale-95 transition-all text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Title / Description */}
            <div className="text-center mb-8">
              <span className="text-xs font-bold text-primary uppercase tracking-widest">
                Arena Selection
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold mt-1">
                {game.title}
              </h2>
              <p className="text-sm text-muted-foreground mt-2 px-2 max-w-sm mx-auto">
                Select your preferred way to play and jump straight into the action.
              </p>
            </div>

            {/* Mode Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Play Offline Option */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleModeClick("offline")}
                className="group relative flex flex-col items-center justify-center p-6 rounded-2xl bg-card/40 border border-border/40 hover:border-primary/40 hover:bg-primary/5 text-center transition-all duration-300 h-[170px]"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-6 w-6" />
                </div>
                <span className="text-base font-extrabold">Play Offline</span>
                <span className="text-xs text-muted-foreground mt-1 max-w-[150px]">
                  Pass & Play with friends locally on same device.
                </span>
              </motion.button>

              {/* Play Online Option */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleModeClick("online")}
                className="group relative flex flex-col items-center justify-center p-6 rounded-2xl bg-card/40 border border-border/40 hover:border-emerald-500/40 hover:bg-emerald-500/5 text-center transition-all duration-300 h-[170px]"
              >
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Globe className="h-6 w-6" />
                </div>
                <span className="text-base font-extrabold">Play Online</span>
                <span className="text-xs text-muted-foreground mt-1 max-w-[150px]">
                  Create or join rooms to challenge others online.
                </span>
              </motion.button>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                onClick={onClose}
                className="rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Go Back
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
