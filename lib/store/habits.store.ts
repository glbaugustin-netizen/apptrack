import { create } from "zustand";
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Habit, HabitCompletion } from "@/lib/types/habit.types";

export function computeStreak(habitId: string, completions: HabitCompletion[], todayISO: string): number {
  const done = new Set(completions.filter((c) => c.habitId === habitId).map((c) => c.date));
  const startDate = new Date(todayISO + "T12:00:00Z");
  if (!done.has(todayISO)) startDate.setUTCDate(startDate.getUTCDate() - 1);
  let streak = 0;
  const cur = new Date(startDate);
  while (done.has(cur.toISOString().slice(0, 10))) { streak++; cur.setUTCDate(cur.getUTCDate() - 1); }
  return streak;
}

export function getWeekHistory(habitId: string, completions: HabitCompletion[], weekDates: Date[]): boolean[] {
  const done = new Set(completions.filter((c) => c.habitId === habitId).map((c) => c.date));
  return weekDates.map((d) => done.has(d.toISOString().slice(0, 10)));
}

function makeId() { return Math.random().toString(36).slice(2, 10); }

interface HabitsState {
  habits: Habit[];
  completions: HabitCompletion[];
  isModalOpen: boolean;
  editingHabit: Habit | null;
  loaded: boolean;

  load: (uid: string) => Promise<void>;
  openModal: () => void;
  closeModal: () => void;
  openEditModal: (habit: Habit) => void;
  addHabit: (uid: string, data: Pick<Habit, "name" | "icon" | "color" | "frequency">) => Promise<void>;
  updateHabit: (uid: string, id: string, updates: Pick<Habit, "name" | "icon" | "color" | "frequency">) => Promise<void>;
  deleteHabit: (uid: string, id: string) => Promise<void>;
  reorderHabit: (uid: string, id: string, newOrder: number) => Promise<void>;
  toggleCompletion: (uid: string, habitId: string, date: string) => Promise<void>;
  isCompleted: (habitId: string, date: string) => boolean;
}

export const useHabitsStore = create<HabitsState>((set, get) => ({
  habits: [],
  completions: [],
  isModalOpen: false,
  editingHabit: null,
  loaded: false,

  load: async (uid) => {
    const [habSnap, compSnap] = await Promise.all([
      getDocs(collection(db, "users", uid, "habits")),
      getDocs(collection(db, "users", uid, "habitCompletions")),
    ]);
    const habits = habSnap.docs.map((d) => d.data() as Habit);
    const completions = compSnap.docs.map((d) => d.data() as HabitCompletion);
    set({ habits, completions, loaded: true });
  },

  openModal: () => set({ isModalOpen: true, editingHabit: null }),
  closeModal: () => set({ isModalOpen: false, editingHabit: null }),
  openEditModal: (habit) => set({ isModalOpen: true, editingHabit: habit }),

  addHabit: async (uid, data) => {
    const id = makeId();
    const habit: Habit = { id, name: data.name, icon: data.icon, color: data.color, frequency: data.frequency, targetDays: [], order: get().habits.length, createdAt: new Date().toISOString().slice(0, 10) };
    await setDoc(doc(db, "users", uid, "habits", id), habit);
    set((s) => ({ habits: [...s.habits, habit] }));
  },

  updateHabit: async (uid, id, updates) => {
    set((s) => ({ habits: s.habits.map((h) => h.id === id ? { ...h, ...updates } : h), isModalOpen: false, editingHabit: null }));
    await updateDoc(doc(db, "users", uid, "habits", id), updates as Record<string, unknown>);
  },

  deleteHabit: async (uid, id) => {
    await deleteDoc(doc(db, "users", uid, "habits", id));
    const toDelete = get().completions.filter((c) => c.habitId === id);
    await Promise.all(toDelete.map((c) => deleteDoc(doc(db, "users", uid, "habitCompletions", `${c.habitId}_${c.date}`))));
    set((s) => ({ habits: s.habits.filter((h) => h.id !== id), completions: s.completions.filter((c) => c.habitId !== id) }));
  },

  reorderHabit: async (uid, id, newOrder) => {
    set((s) => ({ habits: s.habits.map((h) => (h.id === id ? { ...h, order: newOrder } : h)) }));
    await updateDoc(doc(db, "users", uid, "habits", id), { order: newOrder });
  },

  toggleCompletion: async (uid, habitId, date) => {
    const exists = get().completions.some((c) => c.habitId === habitId && c.date === date);
    const docId = `${habitId}_${date}`;
    if (exists) {
      await deleteDoc(doc(db, "users", uid, "habitCompletions", docId));
      set((s) => ({ completions: s.completions.filter((c) => !(c.habitId === habitId && c.date === date)) }));
    } else {
      const comp: HabitCompletion = { habitId, date };
      await setDoc(doc(db, "users", uid, "habitCompletions", docId), comp);
      set((s) => ({ completions: [...s.completions, comp] }));
    }
  },

  isCompleted: (habitId, date) => get().completions.some((c) => c.habitId === habitId && c.date === date),
}));
