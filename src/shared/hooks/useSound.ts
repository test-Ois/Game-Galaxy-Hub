// ============================================================
// useSound Hook — Web Audio API Sound Effects
// ============================================================

"use client";

import { useCallback, useRef } from "react";
import { useSettingsStore } from "@/features/settings";

export function useSound() {
  const gameSoundEnabled = useSettingsStore((s) => s.gameSoundEnabled);
  const acRef = useRef<AudioContext | null>(null);

  const getContext = useCallback(() => {
    if (!acRef.current) {
      try {
        acRef.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      } catch {
        // Web Audio not supported
      }
    }
    return acRef.current;
  }, []);

  const beep = useCallback(
    (
      freq: number = 600,
      duration: number = 80,
      type: OscillatorType = "sine",
      volume: number = 0.03
    ) => {
      if (!gameSoundEnabled) return;
      const ac = getContext();
      if (!ac) return;

      const oscillator = ac.createOscillator();
      const gain = ac.createGain();
      oscillator.type = type;
      oscillator.frequency.value = freq;
      gain.gain.value = volume;
      oscillator.connect(gain).connect(ac.destination);
      oscillator.start();
      oscillator.stop(ac.currentTime + duration / 1000);
    },
    [gameSoundEnabled, getContext]
  );

  const playMove = useCallback(() => {
    beep(700, 60, "square", 0.025);
  }, [beep]);

  const playAIMove = useCallback(() => {
    beep(500, 55, "triangle", 0.025);
  }, [beep]);

  const playWin = useCallback(() => {
    beep(880, 120, "sawtooth", 0.04);
    setTimeout(() => beep(660, 120, "square", 0.04), 130);
  }, [beep]);

  const playDraw = useCallback(() => {
    beep(300, 120, "sine", 0.03);
  }, [beep]);

  const playClick = useCallback(() => {
    beep(440, 30, "sine", 0.02);
  }, [beep]);

  const playError = useCallback(() => {
    beep(200, 150, "sawtooth", 0.03);
  }, [beep]);

  // Ludo Synthesized Sounds
  const playDiceRoll = useCallback(() => {
    // Noise-like rattle effect using a fast sequence of small chirps
    beep(900, 20, "triangle", 0.015);
    setTimeout(() => beep(750, 20, "triangle", 0.015), 30);
    setTimeout(() => beep(600, 20, "triangle", 0.015), 60);
    setTimeout(() => beep(800, 25, "triangle", 0.015), 90);
  }, [beep]);

  const playTokenMove = useCallback(() => {
    // Pleasant ascending chirp
    beep(523.25, 40, "sine", 0.025); // C5
    setTimeout(() => beep(659.25, 60, "sine", 0.025), 45); // E5
  }, [beep]);

  const playCapture = useCallback(() => {
    // Dramatic descending laser effect
    beep(600, 80, "sawtooth", 0.03);
    setTimeout(() => beep(300, 120, "sawtooth", 0.03), 85);
  }, [beep]);

  const playHomeReach = useCallback(() => {
    // Beautiful fanfare chime
    beep(523.25, 80, "sine", 0.03); // C5
    setTimeout(() => beep(659.25, 80, "sine", 0.03), 90); // E5
    setTimeout(() => beep(783.99, 80, "sine", 0.03), 180); // G5
    setTimeout(() => beep(1046.5, 150, "sine", 0.03), 270); // C6
  }, [beep]);

  return { 
    playMove, 
    playAIMove, 
    playWin, 
    playDraw, 
    playClick, 
    playError,
    playDiceRoll,
    playTokenMove,
    playCapture,
    playHomeReach
  };
}
