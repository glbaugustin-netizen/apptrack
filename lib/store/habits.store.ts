import { create } from "zustand";
import { Habit, HabitCompletion } from "@/lib/types/habit.types";
import { apiFetch } from "@/lib/api";

// ── Derived selectors (unchanged) ─────────────────────────────

export function computeStreak(
  habitId: string,
  completions: HabitCompletion[],
  todayISO: string
): number {
  const done = new Set(
    completions.filter((c) => c.habitId === habitId).map((c) => c.date)
  );
  const startDate = new Date(todayISO + "T12:00:00Z");
  if (!done.has(todayISO)) startDate.setUTCDate(startDate.getUTCDate() - 1);
  let streak = 0;
  const cur = new Date(startDate);
  while (done.has(cur.toISOString().slice(0, 10))) {
    streak++;
    cur.setUTCDate(cur.getUTCDate() - 1);
  }
  return streak;
}

export function getWeekHistory(
  habitId: string,
  completions: HabitCompletion[],
  weekDates: Date[]
): boolean[] {
  const done = new Set(
    completions.filter((c) => c.habitId === habitId).map((c) => c.date)
  );
  return weekDates.map((d) => done.has(d.toISOString().slice(0, 10)));
}

// ── Store ──────────────────────────────────────────────────────

interface HabitsState {
  habits: Habit[];
  completions: HabitCompletion[];
  isModalOpen: boolean;
  loaded: boolean;

  load: () => Promise<void>;
  openModal: () => void;
  closeModal: () => void;
  addHabit: (data: Pick<Habit, "name" | "icon" | "color" | "frequency">) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  reorderHabit: (id: string, newOrder: number) => Promise<void>;
  toggleCompletion: (habitId: string, date: string) => Promise<void>;
  isCompleted: (habitId: string, date: string) => boolean;
}

export const useHabitsStore = create<HabitsState>((set, get) => ({
  habits: [],
  completions: [],
  isModalOpen: false,
  loaded: false,

  load: async () => {
    if (get().loaded) return;
    const { habits, completions } = await apiFetch<{
      habits: Habit[];
      completions: HabitCompletion[];
    }>("/api/habits");
    set({ habits, completions, loaded: true });
  },

  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),

  addHabit: async (data) => {
    const { habit } = await apiFetch<{ habit: Habit }>("/api/habits", {
      method: "POST",
      body: JSON.stringify(data),
    });
    set((s) => ({ habits: [...s.habits, habit] }));
  },

  deleteHabit: async (id) => {
    await apiFetch(`/api/habits/${id}`, { method: "DELETE" });
    set((s) => ({
      habits: s.habits.filter((h) => h.id !== id),
      completions: s.completions.filter((c) => c.habitId !== id),
    }));
  },

  reorderHabit: async (id, newOrder) => {
    set((s) => ({
      habits: s.habits.map((h) => (h.id === id ? { ...h, order: newOrder } : h)),
    }));
    await apiFetch(`/api/habits/${id}`, {
      method: "PUT",
      body: JSON.stringify({ order: newOrder }),
    });
  },

  toggleCompletion: async (habitId, date) => {
    const exists = get().completions.some(
      (c) => c.habitId === habitId && c.date === date
    );
    // Optimistic update
    set((s) => ({
      completions: exists
        ? s.completions.filter((c) => !(c.habitId === habitId && c.date === date))
        : [...s.completions, { habitId, date }],
    }));
    await apiFetch(`/api/habits/${habitId}/toggle`, {
      method: "POST",
      body: JSON.stringify({ date }),
    });
  },

  isCompleted: (habitId, date) =>
    get().completions.some((c) => c.habitId === habitId && c.date === date),
}));
