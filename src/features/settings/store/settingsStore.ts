// ============================================================
// Settings Store — Sound & UI Preferences
// ============================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsStore {
  gameSoundEnabled: boolean;
  soundEnabled: boolean; // Keep as synchronized alias for compatibility
  voiceMicEnabled: boolean;
  voiceSpeakerEnabled: boolean;
  animationsEnabled: boolean;

  // Actions
  toggleGameSound: () => void;
  setGameSoundEnabled: (v: boolean) => void;
  toggleVoiceMic: () => void;
  setVoiceMicEnabled: (v: boolean) => void;
  toggleVoiceSpeaker: () => void;
  setVoiceSpeakerEnabled: (v: boolean) => void;
  toggleAnimations: () => void;
  setAnimationsEnabled: (v: boolean) => void;

  // Legacy Actions for compatibility
  toggleSound: () => void;
  setSoundEnabled: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      gameSoundEnabled: true,
      soundEnabled: true,
      voiceMicEnabled: true,
      voiceSpeakerEnabled: true,
      animationsEnabled: true,

      toggleGameSound: () =>
        set((s) => {
          const next = !s.gameSoundEnabled;
          return { gameSoundEnabled: next, soundEnabled: next };
        }),
      setGameSoundEnabled: (v: boolean) => set({ gameSoundEnabled: v, soundEnabled: v }),
      toggleVoiceMic: () => set((s) => ({ voiceMicEnabled: !s.voiceMicEnabled })),
      setVoiceMicEnabled: (v: boolean) => set({ voiceMicEnabled: v }),
      toggleVoiceSpeaker: () => set((s) => ({ voiceSpeakerEnabled: !s.voiceSpeakerEnabled })),
      setVoiceSpeakerEnabled: (v: boolean) => set({ voiceSpeakerEnabled: v }),
      toggleAnimations: () => set((s) => ({ animationsEnabled: !s.animationsEnabled })),
      setAnimationsEnabled: (v: boolean) => set({ animationsEnabled: v }),

      // Keep legacy synchronized
      toggleSound: () =>
        set((s) => {
          const next = !s.soundEnabled;
          return { soundEnabled: next, gameSoundEnabled: next };
        }),
      setSoundEnabled: (v: boolean) => set({ soundEnabled: v, gameSoundEnabled: v }),
    }),
    {
      name: "ttt-settings",
    }
  )
);
