"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Bot, Users, Grid3X3 } from "lucide-react";
import { GAMES_CONFIG, GameConfig } from "@/shared/config/gameConfig";
import { GameCard, GameDetailsModal } from "@/features/multiplayer";

const features = [
  {
    icon: Bot,
    title: "Smart AI Engine",
    description: "Battle Minimax-powered AI models built on state-authoritative algorithms.",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    icon: Users,
    title: "Multiplayer Lobby",
    description: "Connect instantly with peer networks over live authoritative WebSockets.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Grid3X3,
    title: "Custom Formats",
    description: "Adjust rules, board dimensions, target series totals, and participant numbers.",
    gradient: "from-emerald-500 to-teal-500",
  },
];

export default function GamesPage() {
  const [selectedGame, setSelectedGame] = useState<GameConfig | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleGameClick = (game: GameConfig) => {
    setSelectedGame(game);
    setIsModalOpen(true);
  };

  return (
    <div className="relative min-h-[90vh] px-4 py-8 sm:py-12 md:py-16 pt-24 sm:pt-28">
      {/* ─── Hero / Header ─── */}
      <section className="text-center max-w-4xl mx-auto w-full mb-10 sm:mb-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 glass rounded-full px-4.5 py-1.5 mb-6"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
            Game Library
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.1] mb-4 sm:mb-6"
        >
          All Available{" "}
          <span className="bg-gradient-to-r from-primary via-purple-500 to-emerald-500 bg-clip-text text-transparent animate-gradient">
            Games
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed"
        >
          Browse and play our local same-device offline games or enter multiplayer matchmaking lobbies.
        </motion.p>
      </section>

      {/* ─── Dedicated Game Hub Grid ─── */}
      <section className="max-w-6xl mx-auto mb-16 sm:mb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {GAMES_CONFIG.map((game, idx) => (
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

      {/* ─── Quick Feature Highlights ─── */}
      <section className="max-w-5xl mx-auto pt-8 border-t border-border/30">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05, duration: 0.4 }}
              className="glass rounded-2xl p-5 hover:bg-card/60 transition-all duration-300 flex items-start gap-4"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shrink-0 shadow-md`}>
                <feature.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-bold mb-1">{feature.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
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
