// ============================================================
// Landing Page — Hero + Features + CTA
// ============================================================

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Gamepad2,
  Bot,
  Users,
  Trophy,
  Zap,
  Moon,
  BarChart3,
  Sparkles,
  ArrowRight,
  Grid3X3,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Bot,
    title: "Smart AI Opponents",
    description:
      "Challenge AI with 3 difficulty levels. Hard mode uses Minimax with alpha-beta pruning.",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    icon: Users,
    title: "Local Multiplayer",
    description:
      "Play with friends on the same device with smooth turn-based gameplay.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Grid3X3,
    title: "Multiple Board Sizes",
    description:
      "Choose from 3×3, 4×4, or 5×5 boards for varying levels of complexity.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: Trophy,
    title: "Series Mode",
    description:
      "Play Best of 1, 3, or 5 series with automatic score tracking.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: BarChart3,
    title: "Match History",
    description:
      "Track all your games with detailed statistics and performance analytics.",
    gradient: "from-rose-500 to-pink-500",
  },
  {
    icon: Moon,
    title: "Dark & Light Themes",
    description:
      "Premium dark mode with glassmorphism effects, plus a clean light theme for any preference.",
    gradient: "from-indigo-500 to-blue-600",
  },
];


const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function HomePage() {
  return (
    <div className="relative">
      {/* ─── Hero Section ─── */}
      <section className="relative min-h-[85vh] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center max-w-3xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-8"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">
              AI-Powered Gaming Platform
            </span>
          </motion.div>

          {/* Title */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            <span className="block">The Ultimate</span>
            <span className="block bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent animate-gradient">
              TicTacToe
            </span>
            <span className="block">Experience</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            Challenge AI opponents, track your progress, and master the game.
            Built with modern engineering for a premium gaming experience.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/play">
              <Button
                size="lg"
                className="h-13 px-8 rounded-2xl text-base font-semibold gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow"
              >
                <Gamepad2 className="h-5 w-5" />
                Play Now
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                variant="outline"
                size="lg"
                className="h-13 px-8 rounded-2xl text-base font-semibold gap-2 glass"
              >
                <BarChart3 className="h-5 w-5" />
                View Dashboard
              </Button>
            </Link>
          </div>

          {/* Floating Game Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-16 relative"
          >
            <div className="glass-strong rounded-3xl p-6 max-w-xs mx-auto shadow-2xl animate-float">
              <div className="grid grid-cols-3 gap-2">
                {["O", null, "X", null, "O", null, "X", null, "O"].map(
                  (cell, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-xl bg-card/60 border border-border/50 flex items-center justify-center text-xl font-bold"
                    >
                      <span
                        className={
                          cell === "X"
                            ? "text-game-x"
                            : cell === "O"
                              ? "text-game-o"
                              : ""
                        }
                      >
                        {cell}
                      </span>
                    </div>
                  )
                )}
              </div>
              {/* Diagonal win line */}
              <svg
                className="absolute inset-6 w-[calc(100%-3rem)] h-[calc(100%-3rem)] pointer-events-none"
                viewBox="0 0 300 300"
              >
                <motion.line
                  x1="50" y1="50" x2="250" y2="250"
                  className="stroke-primary"
                  strokeWidth="6"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, delay: 1, ease: "easeInOut" }}
                  style={{ filter: "drop-shadow(0 0 8px var(--primary))" }}
                />
              </svg>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Features Section ─── */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Packed with Features
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              More than just a game — it&apos;s a full-featured platform built with
              modern engineering standards.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                className="glass rounded-2xl p-6 group hover:bg-card/60 transition-all duration-300"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}
                >
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="py-24 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="glass-strong rounded-3xl p-10 sm:p-14">
            <Zap className="h-10 w-10 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Ready to Play?</h2>
            <p className="text-muted-foreground mb-8">
              Jump into a game now and challenge yourself against our AI or play
              with a friend.
            </p>
            <Link href="/play">
              <Button
                size="lg"
                className="h-13 px-10 rounded-2xl text-base font-semibold gap-2 shadow-lg shadow-primary/25"
              >
                <Gamepad2 className="h-5 w-5" />
                Start Playing
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
