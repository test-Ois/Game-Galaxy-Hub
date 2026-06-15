// ============================================================
// Settings Store — Sound & UI Preferences
// ============================================================

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsStore {
  soundEnabled: boolean;

  // Actions
  toggleSound: () => void;
  setSoundEnabled: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      soundEnabled: true,

      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
      setSoundEnabled: (v: boolean) => set({ soundEnabled: v }),
    }),
    {
      name: "ttt-settings",
    }
  )
);
