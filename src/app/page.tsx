"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Trophy, Star, Gamepad2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { GAMES_CONFIG, GameConfig } from "@/lib/game/config";
import { GameCard } from "@/components/game/GameCard";
import { GameDetailsModal } from "@/components/game/GameDetailsModal";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const [selectedGame, setSelectedGame] = useState<GameConfig | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleGameClick = (game: GameConfig) => {
    setSelectedGame(game);
    setIsModalOpen(true);
  };

  // Split configurations into featured vs others
  const featuredGames = GAMES_CONFIG.filter((g) => !g.comingSoon);
  const comingSoonGames = GAMES_CONFIG.filter((g) => g.comingSoon);

  return (
    <div className="relative min-h-[90vh] px-4 py-8 sm:py-12 md:py-16 pt-24 sm:pt-28">
      {/* ─── Ludo King Style Top Arena Welcome Banner ─── */}
      <section className="max-w-6xl mx-auto mb-10 sm:mb-14">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl p-6 sm:p-10 bg-gradient-to-r from-violet-600 via-purple-700 to-indigo-800 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6"
        >
          {/* Decorative backdrop blobs */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent_50%)] pointer-events-none" />
          <div className="absolute -right-24 -bottom-24 w-80 h-80 rounded-full bg-pink-500/20 blur-3xl" />

          <div className="space-y-4 text-center md:text-left z-10 max-w-2xl">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white text-[10px] sm:text-xs font-black uppercase tracking-widest border border-white/5 shadow-inner">
              <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
              The Ultimate Multi-Game Experience
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-wider leading-none uppercase">
              Welcome to <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-primary via-purple-400 to-indigo-500 bg-clip-text text-transparent">Game Galaxy Hub</span>
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-white/80 leading-relaxed max-w-xl tracking-wide">
              Play Tic-Tac-Toe, Ludo, and more exciting games from one premium gaming hub.
            </p>
          </div>

          <div className="shrink-0 z-10">
            <Link href="/games">
              <Button
                size="lg"
                className="h-13 px-8 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-sm gap-2 hover:scale-105 shadow-xl shadow-amber-400/20 transition-all duration-300"
              >
                <Gamepad2 className="h-4.5 w-4.5" />
                Browse Game Library
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ─── Featured Games Section ─── */}
      <section className="max-w-6xl mx-auto mb-16">
        <div className="flex items-center gap-2 mb-6 sm:mb-8">
          <Star className="h-5.5 w-5.5 text-amber-500 fill-amber-500" />
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Featured Games
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {featuredGames.map((game, idx) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
            >
              <GameCard game={game} onClick={handleGameClick} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Coming Soon / Future Ready Section ─── */}
      <section className="max-w-6xl mx-auto border-t border-border/30 pt-10 sm:pt-14">
        <div className="flex items-center gap-2 mb-6 sm:mb-8">
          <Trophy className="h-5.5 w-5.5 text-primary" />
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Future Arenas
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {comingSoonGames.map((game, idx) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
            >
              <GameCard game={game} onClick={handleGameClick} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Game Selection Modal overlay ─── */}
      <GameDetailsModal
        game={selectedGame}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
