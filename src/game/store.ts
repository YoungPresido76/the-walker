import { create } from "zustand";

export type Phase = "title" | "playing" | "paused" | "won";

export type HudState = {
  phase: Phase;
  collected: number;
  total: number;
  wonTime: number;
  seed: number;
  locked: boolean;
  touch: boolean;
  reset: (opts: { seed: number; total: number; touch: boolean }) => void;
  setPhase: (phase: Phase) => void;
};

export const useHud = create<HudState>((set) => ({
  phase: "title",
  collected: 0,
  total: 8,
  wonTime: 0,
  seed: 0,
  locked: false,
  touch: false,
  reset: ({ seed, total, touch }) =>
    set({
      phase: "title",
      collected: 0,
      total,
      wonTime: 0,
      seed,
      locked: false,
      touch,
    }),
  setPhase: (phase) => set({ phase }),
}));

export function formatTime(seconds: number): string {
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  const rest = s - m * 60;
  const whole = Math.floor(rest);
  const frac = Math.floor((rest - whole) * 100);
  return `${m}:${String(whole).padStart(2, "0")}.${String(frac).padStart(2, "0")}`;
}
