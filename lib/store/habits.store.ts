import { create } from "zustand";
import { Habit, HabitCompletion } from "@/lib/types/habit.types";

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

interface HabitsState {
  habits: Habit[];
  completions: HabitCompletion[];
  isModalOpen: boolean;

  openModal: () => void;
  closeModal: () => void;
  addHabit: (data: Pick<Habit, "name" | "icon" | "color" | "frequency">) => void;
  deleteHabit: (id: string) => void;
  reorderHabit: (id: string, newOrder: number) => void;
  toggleCompletion: (habitId: string, date: string) => void;
  isCompleted: (habitId: string, date: string) => boolean;
}

export const useHabitsStore = create<HabitsState>((set, get) => ({
  habits: [],
  completions: [],
  isModalOpen: false,

  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),

  addHabit: (data) => {
    const id = Math.random().toString(36).slice(2, 10);
    const habit: Habit = {
      id,
      name: data.name,
      icon: data.icon,
      color: data.color,
      frequency: data.frequency,
      targetDays: [],
      order: get().habits.length,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    set((s) => ({ habits: [...s.habits, habit] }));
  },

  deleteHabit: (id) =>
    set((s) => ({
      habits: s.habits.filter((h) => h.id !== id),
      completions: s.completions.filter((c) => c.habitId !== id),
    })),

  reorderHabit: (id, newOrder) =>
    set((s) => ({
      habits: s.habits.map((h) => (h.id === id ? { ...h, order: newOrder } : h)),
    })),

  toggleCompletion: (habitId, date) =>
    set((s) => {
      const exists = s.completions.some((c) => c.habitId === habitId && c.date === date);
      return {
        completions: exists
          ? s.completions.filter((c) => !(c.habitId === habitId && c.date === date))
          : [...s.completions, { habitId, date }],
      };
    }),

  isCompleted: (habitId, date) =>
    get().completions.some((c) => c.habitId === habitId && c.date === date),
}));
