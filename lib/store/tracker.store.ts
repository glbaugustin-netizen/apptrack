import { create } from "zustand";
import { Project, TimeEntry } from "@/lib/types/timeEntry.types";

function makeId() { return Math.random().toString(36).slice(2, 10); }
function nowISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

interface TrackerState {
  projects: Project[];
  entries: TimeEntry[];
  runningId: string | null;

  startTimer: (description: string, projectId: string | null, tag: string) => void;
  stopTimer: () => void;
  deleteEntry: (id: string) => void;
  addProject: (name: string, color: string) => void;
}

export const useTrackerStore = create<TrackerState>((set, get) => ({
  projects: [],
  entries: [],
  runningId: null,

  startTimer: (description, projectId, tag) => {
    get().stopTimer();
    const entry: TimeEntry = {
      id: makeId(),
      projectId,
      description,
      tags: tag ? [tag] : [],
      startAt: nowISO(),
      endAt: null,
      duration: null,
      createdAt: nowISO().slice(0, 10),
    };
    set((s) => ({ entries: [entry, ...s.entries], runningId: entry.id }));
  },

  stopTimer: () => {
    const { runningId } = get();
    if (!runningId) return;
    const endAt = nowISO();
    set((s) => ({
      runningId: null,
      entries: s.entries.map((e) => {
        if (e.id !== runningId) return e;
        const start = new Date(e.startAt + ":00").getTime();
        const end = new Date(endAt + ":00").getTime();
        return { ...e, endAt, duration: Math.max(Math.floor((end - start) / 1000), 0) };
      }),
    }));
  },

  deleteEntry: (id) =>
    set((s) => ({
      entries: s.entries.filter((e) => e.id !== id),
      runningId: s.runningId === id ? null : s.runningId,
    })),

  addProject: (name, color) =>
    set((s) => ({
      projects: [...s.projects, { id: makeId(), name, color, archived: false, createdAt: nowISO().slice(0, 10) }],
    })),
}));

export function fmtDuration(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

export function fmtHHMMSS(secs: number): string {
  const h = Math.floor(secs / 3600).toString().padStart(2, "0");
  const m = Math.floor((secs % 3600) / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}
