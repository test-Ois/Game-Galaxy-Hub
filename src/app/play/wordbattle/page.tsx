// ============================================================
// Word Battle Entry — Game Mode Selection Page
// ============================================================

"use client";

import React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Globe, LucideProps } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/services/utils";
import type { ForwardRefExoticComponent, RefAttributes } from "react";

type LucideIcon = ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;

interface GameMode {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  iconComponent?: LucideIcon;
  iconEmoji?: string;
  path: string;
  gradient: string;
  glow: string;
  badge: string;
}

const modes: GameMode[] = [
  {
    id: "solo",
    title: "Solo Mode",
    subtitle: "Wordle-style challenge",
    description: "Guess the secret word in 6 tries. Choose Easy, Medium, or Hard difficulty.",
    iconComponent: BookOpen,
    path: "/play/wordbattle/solo",
    gradient: "from-violet-500 to-purple-600",
    glow: "rgba(139,92,246,0.25)",
    badge: "Offline",
  },
  {
    id: "hangman",
    title: "Hangman Mode",
    subtitle: "Classic word guessing",
    description: "Guess the hidden word letter by letter before the figure is complete. 6 lives.",
    iconEmoji: "🪝",
    path: "/play/wordbattle/hangman",
    gradient: "from-amber-500 to-orange-600",
    glow: "rgba(245,158,11,0.25)",
    badge: "Offline",
  },
  {
    id: "multiplayer",
    title: "Multiplayer",
    subtitle: "Real-time word battle",
    description: "Challenge another player online. First to guess the word wins the round!",
    iconComponent: Globe,
    path: "/online?game=wordbattle",
    gradient: "from-emerald-400 to-teal-500",
    glow: "rgba(16,185,129,0.25)",
    badge: "Online",
  },
];

export default function WordBattleModePage() {
  const router = useRouter();

  return (
    <div className="relative min-h-[calc(100vh-5rem)] flex flex-col items-center px-4 py-8 pt-20 sm:pt-24">
      {/* Back Button */}
      <div className="absolute top-4 left-4 z-40">
        <Button
          onClick={() => router.push("/")}
          variant="ghost"
          size="icon"
          className="w-11 h-11 rounded-full glass hover:bg-accent"
          aria-label="Back to Home"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg space-y-8"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest">
            ⚔️ Word Battle
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Select Game Mode</h1>
          <p className="text-sm text-muted-foreground">Choose how you want to battle with words</p>
        </div>

        {/* Mode Cards */}
        <div className="space-y-4">
          {modes.map((mode, idx) => {
            const IconComponent = mode.iconComponent;
            return (
              <motion.button
                key={mode.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.4 }}
                whileHover={{ scale: 1.015, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push(mode.path)}
                className="group w-full glass rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-border/40 hover:border-border/80 text-left transition-all duration-300 shadow-sm hover:shadow-xl"
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 30px ${mode.glow}`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={cn(
                      "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300",
                      mode.gradient
                    )}
                  >
                    {IconComponent ? (
                      <IconComponent className="h-6 w-6 text-white" />
                    ) : (
                      <span className="text-2xl" role="img" aria-label={mode.title}>{mode.iconEmoji}</span>
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-extrabold">{mode.title}</h3>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[9px] font-bold px-2 py-0.5",
                          mode.badge === "Online"
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : "bg-primary/10 text-primary border-primary/20"
                        )}
                      >
                        {mode.badge}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-semibold">{mode.subtitle}</p>
                    <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
                      {mode.description}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="flex-shrink-0 mt-1 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all">
                    →
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Footer tag */}
        <p className="text-center text-[10px] text-muted-foreground/60 font-medium">
          Part of Game Galaxy Hub · Premium Gaming Experience
        </p>
      </motion.div>
    </div>
  );
}
