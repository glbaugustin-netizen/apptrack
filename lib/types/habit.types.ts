export type HabitFrequency = "daily" | "weekdays" | "weekend" | "custom";

export interface Habit {
  id: string;
  name: string;
  icon: string;       // Tabler icon name, e.g. "ti-run"
  color: string;      // hex, e.g. "#639922"
  frequency: HabitFrequency;
  targetDays: number[]; // 1=Mon … 7=Sun
  order: number;
  createdAt: string;  // YYYY-MM-DD
}

export interface HabitCompletion {
  habitId: string;
  date: string; // YYYY-MM-DD
}

export interface HabitStats {
  habitId: string;
  streak: number;
  completionRate: number; // 0–1
  totalCompletions: number;
}
