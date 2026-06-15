// ============================================================
// useSound Hook — Web Audio API Sound Effects
// ============================================================

"use client";

import { useCallback, useRef } from "react";
import { useSettingsStore } from "@/stores/settingsStore";

export function useSound() {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
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
      if (!soundEnabled) return;
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
    [soundEnabled, getContext]
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

  return { playMove, playAIMove, playWin, playDraw, playClick, playError };
}
