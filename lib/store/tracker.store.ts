import { create } from "zustand";
import { Project, TimeEntry } from "@/lib/types/timeEntry.types";
import { apiFetch } from "@/lib/api";

function nowISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

interface TrackerState {
  projects: Project[];
  entries: TimeEntry[];
  runningId: string | null;
  loaded: boolean;

  load: () => Promise<void>;
  startTimer: (description: string, projectId: string | null, tag: string) => Promise<void>;
  stopTimer: () => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  addProject: (name: string, color: string) => Promise<void>;
}

export const useTrackerStore = create<TrackerState>((set, get) => ({
  projects: [],
  entries: [],
  runningId: null,
  loaded: false,

  load: async () => {
    if (get().loaded) return;
    const [{ projects }, { entries }] = await Promise.all([
      apiFetch<{ projects: Project[] }>("/api/tracker/projects"),
      apiFetch<{ entries: TimeEntry[] }>("/api/tracker/entries"),
    ]);
    const running = entries.find((e) => e.endAt === null);
    set({ projects, entries, runningId: running?.id ?? null, loaded: true });
  },

  startTimer: async (description, projectId, tag) => {
    const { entry } = await apiFetch<{ entry: TimeEntry }>("/api/tracker/entries", {
      method: "POST",
      body: JSON.stringify({ description, projectId, tags: tag ? [tag] : [] }),
    });
    set((s) => ({
      entries: [entry, ...s.entries.filter((e) => e.endAt !== null)],
      runningId: entry.id,
    }));
    // Reload to get updated stopped entry if any
    const { entries } = await apiFetch<{ entries: TimeEntry[] }>("/api/tracker/entries");
    const running = entries.find((e) => e.endAt === null);
    set({ entries, runningId: running?.id ?? null });
  },

  stopTimer: async () => {
    const { runningId } = get();
    if (!runningId) return;
    const { entry } = await apiFetch<{ entry: TimeEntry }>(
      `/api/tracker/entries/${runningId}/stop`,
      { method: "POST" }
    );
    set((s) => ({
      runningId: null,
      entries: s.entries.map((e) => (e.id === runningId ? entry : e)),
    }));
  },

  deleteEntry: async (id) => {
    await apiFetch(`/api/tracker/entries/${id}`, { method: "DELETE" });
    set((s) => ({
      entries: s.entries.filter((e) => e.id !== id),
      runningId: s.runningId === id ? null : s.runningId,
    }));
  },

  addProject: async (name, color) => {
    const { project } = await apiFetch<{ project: Project }>("/api/tracker/projects", {
      method: "POST",
      body: JSON.stringify({ name, color }),
    });
    set((s) => ({ projects: [...s.projects, project] }));
  },
}));

// ── Helpers exportés (inchangés) ──────────────────────────────

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
