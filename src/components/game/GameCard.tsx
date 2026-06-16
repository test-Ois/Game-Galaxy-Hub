"use client";

import { motion } from "framer-motion";
import { ArrowRight, Play, Hourglass } from "lucide-react";
import { GameConfig } from "@/lib/game/config";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface GameCardProps {
  game: GameConfig;
  onClick: (game: GameConfig) => void;
}

export function GameCard({ game, onClick }: GameCardProps) {
  const isComingSoon = !!game.comingSoon;

  return (
    <motion.div
      whileHover={isComingSoon ? {} : { y: -6, scale: 1.02 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`relative overflow-hidden glass rounded-3xl p-6 flex flex-col justify-between h-[320px] sm:h-[350px] border border-white/10 group shadow-xl transition-all duration-300 ${
        isComingSoon
          ? "opacity-60 cursor-not-allowed"
          : "cursor-pointer hover:shadow-2xl hover:border-white/20"
      }`}
      onClick={() => !isComingSoon && onClick(game)}
    >
      {/* Decorative Background Gradient Blur */}
      <div className={`absolute top-0 right-0 w-48 h-48 rounded-full bg-gradient-to-br ${game.gradient} opacity-20 blur-3xl -mr-16 -mt-16 group-hover:opacity-35 transition-opacity duration-300`} />

      <div>
        {/* Game Icon/Badge Decoration */}
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${game.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-6`}>
          {isComingSoon ? (
            <Hourglass className="h-6 w-6 text-white" />
          ) : (
            <Play className="h-6 w-6 text-white fill-white/10" />
          )}
        </div>

        {/* Title & Badge */}
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {game.title}
          </h3>
          {isComingSoon && (
            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary font-bold bg-primary/5">
              Coming Soon
            </Badge>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4 pr-4">
          {game.description}
        </p>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {isComingSoon ? "Future Release" : `${game.modes.join(" • ")} Mode`}
        </span>
        {!isComingSoon && (
          <Button
            size="sm"
            className={`h-10 px-5 rounded-xl bg-gradient-to-r ${game.gradient} text-white font-bold gap-1.5 shadow-md hover:brightness-110 transition-all duration-300`}
          >
            Select Mode
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}
