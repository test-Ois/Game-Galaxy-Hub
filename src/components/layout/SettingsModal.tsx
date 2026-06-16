// ============================================================
// Settings Modal — Responsive Premium Dialog
// ============================================================

"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Sun,
  Moon,
  Monitor,
  Sparkles,
  Gamepad2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettingsStore } from "@/stores/settingsStore";
import { cn } from "@/lib/utils";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Settings states from Zustand Store
  const gameSoundEnabled = useSettingsStore((s) => s.gameSoundEnabled);
  const toggleGameSound = useSettingsStore((s) => s.toggleGameSound);

  const voiceMicEnabled = useSettingsStore((s) => s.voiceMicEnabled);
  const toggleVoiceMic = useSettingsStore((s) => s.toggleVoiceMic);

  const voiceSpeakerEnabled = useSettingsStore((s) => s.voiceSpeakerEnabled);
  const toggleVoiceSpeaker = useSettingsStore((s) => s.toggleVoiceSpeaker);

  const animationsEnabled = useSettingsStore((s) => s.animationsEnabled);
  const toggleAnimations = useSettingsStore((s) => s.toggleAnimations);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative w-full max-w-md overflow-hidden rounded-t-3xl sm:rounded-3xl border border-border/40 bg-background/95 glass-strong p-4 sm:p-6 shadow-2xl z-10 max-h-[90vh] sm:max-h-[85vh] pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border/30">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Gamepad2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight">Game Settings</h2>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                    Preferences
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-10 w-10 rounded-full hover:bg-accent border border-transparent hover:border-border/30"
                aria-label="Close Settings"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Scrollable Container */}
            <div className="py-3 sm:py-4 space-y-5 sm:space-y-6 max-h-[55vh] sm:max-h-[60vh] overflow-y-auto pr-1 -mr-1">
              
              {/* ─── SECTION: GAME AUDIO ─── */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Game Audio
                </h3>
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-card/40 border border-border/30">
                  <div className="flex gap-3 items-center">
                    <div className={cn(
                      "p-2 rounded-xl border transition-colors",
                      gameSoundEnabled 
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                        : "bg-muted text-muted-foreground border-border/40"
                    )}>
                      {gameSoundEnabled ? <Volume2 className="h-4.5 w-4.5" /> : <VolumeX className="h-4.5 w-4.5" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">Game Sounds</h4>
                      <p className="text-xs text-muted-foreground">Sound effects on moves & results</p>
                    </div>
                  </div>
                  {/* Premium Switch */}
                  <button
                    onClick={toggleGameSound}
                    className={cn(
                      "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 outline-none border border-transparent",
                      gameSoundEnabled ? "bg-primary" : "bg-muted"
                    )}
                    aria-label="Toggle game sounds"
                  >
                    <motion.span
                      layout
                      className="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg"
                      animate={{ x: gameSoundEnabled ? 22 : 4 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
              </div>

              {/* ─── SECTION: VOICE CHAT ─── */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Voice Chat Controls
                  </h3>
                  <div className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-primary/10 text-primary border border-primary/20">
                    Online Match Only
                  </div>
                </div>
                <div className="space-y-2">
                  {/* Microfone Toggle */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-card/40 border border-border/30">
                    <div className="flex gap-3 items-center">
                      <div className={cn(
                        "p-2 rounded-xl border transition-all",
                        voiceMicEnabled 
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.15)]" 
                          : "bg-red-500/10 text-red-500 border-red-500/20"
                      )}>
                        {voiceMicEnabled ? <Mic className="h-4.5 w-4.5" /> : <MicOff className="h-4.5 w-4.5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold">My Microphone</h4>
                          <span className={cn("text-[9px] font-bold px-1 py-0.2 rounded", voiceMicEnabled ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500")}>
                            {voiceMicEnabled ? "On" : "Off"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">Transmit my voice to opponent</p>
                      </div>
                    </div>
                    {/* Switch */}
                    <button
                      onClick={toggleVoiceMic}
                      className={cn(
                        "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 outline-none border border-transparent",
                        voiceMicEnabled ? "bg-emerald-500" : "bg-muted"
                      )}
                      aria-label="Toggle microphone"
                    >
                      <motion.span
                        layout
                        className="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg"
                        animate={{ x: voiceMicEnabled ? 22 : 4 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    </button>
                  </div>

                  {/* Speaker Toggle */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-card/40 border border-border/30">
                    <div className="flex gap-3 items-center">
                      <div className={cn(
                        "p-2 rounded-xl border transition-all",
                        voiceSpeakerEnabled 
                          ? "bg-sky-500/10 text-sky-500 border-sky-500/20 shadow-[0_0_10px_rgba(14,165,233,0.15)]" 
                          : "bg-muted text-muted-foreground border-border/40"
                      )}>
                        {voiceSpeakerEnabled ? <Volume2 className="h-4.5 w-4.5" /> : <VolumeX className="h-4.5 w-4.5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold">Opponent Voice</h4>
                          <span className={cn("text-[9px] font-bold px-1 py-0.2 rounded", voiceSpeakerEnabled ? "bg-sky-500/10 text-sky-500" : "bg-muted text-muted-foreground border border-border/30")}>
                            {voiceSpeakerEnabled ? "On" : "Off"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">Listen to opponent incoming audio</p>
                      </div>
                    </div>
                    {/* Switch */}
                    <button
                      onClick={toggleVoiceSpeaker}
                      className={cn(
                        "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 outline-none border border-transparent",
                        voiceSpeakerEnabled ? "bg-sky-500" : "bg-muted"
                      )}
                      aria-label="Toggle opponent voice"
                    >
                      <motion.span
                        layout
                        className="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg"
                        animate={{ x: voiceSpeakerEnabled ? 22 : 4 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* ─── SECTION: GAMEPLAY PREFERENCES ─── */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Gameplay & Theme
                </h3>
                <div className="space-y-2">
                  {/* Theme Selector Button Row */}
                  <div className="p-3.5 rounded-2xl bg-card/40 border border-border/30 space-y-3">
                    <div>
                      <h4 className="text-sm font-bold">Theme Mode</h4>
                      <p className="text-xs text-muted-foreground">Switch visual look of the arena</p>
                    </div>
                    <div className="grid grid-cols-3 gap-1 sm:gap-1.5 p-1 rounded-xl bg-background/50 border border-border/20">
                      {[
                        { id: "light", label: "Light", icon: Sun },
                        { id: "dark", label: "Dark", icon: Moon },
                        { id: "system", label: "System", icon: Monitor },
                      ].map((t) => {
                        const Icon = t.icon;
                        const isActive = theme === t.id;
                        return (
                          <button
                            key={t.id}
                            onClick={() => setTheme(t.id)}
                            className={cn(
                              "relative flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-2 sm:px-3 rounded-lg text-[10px] sm:text-xs font-bold transition-all outline-none",
                              isActive
                                ? "bg-primary text-primary-foreground shadow-md font-extrabold"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            <span>{t.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Animations Toggle */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-card/40 border border-border/30">
                    <div className="flex gap-3 items-center">
                      <div className={cn(
                        "p-2 rounded-xl border transition-colors",
                        animationsEnabled 
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/20" 
                          : "bg-muted text-muted-foreground border-border/40"
                      )}>
                        <Sparkles className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold">Animations</h4>
                        <p className="text-xs text-muted-foreground">Enable dynamic screen effects</p>
                      </div>
                    </div>
                    {/* Switch */}
                    <button
                      onClick={toggleAnimations}
                      className={cn(
                        "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 outline-none border border-transparent",
                        animationsEnabled ? "bg-amber-500" : "bg-muted"
                      )}
                      aria-label="Toggle animations"
                    >
                      <motion.span
                        layout
                        className="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg"
                        animate={{ x: animationsEnabled ? 22 : 4 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-border/30 flex justify-end">
              <Button
                onClick={onClose}
                className="w-full h-11 sm:h-11 rounded-xl font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/10"
              >
                Save Preferences
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
