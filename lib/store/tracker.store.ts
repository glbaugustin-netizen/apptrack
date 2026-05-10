import { create } from "zustand";
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Project, TimeEntry } from "@/lib/types/timeEntry.types";

function makeId() { return Math.random().toString(36).slice(2, 10); }

function nowISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

function parseISO(s: string): number {
  return new Date(s).getTime();
}

interface TrackerState {
  projects: Project[];
  entries: TimeEntry[];
  runningId: string | null;
  loaded: boolean;
  editingEntry: TimeEntry | null;

  load: (uid: string) => Promise<void>;
  startTimer: (uid: string, description: string, projectId: string | null, tag: string) => Promise<void>;
  stopTimer: (uid: string) => Promise<void>;
  deleteEntry: (uid: string, id: string) => Promise<void>;
  updateEntry: (uid: string, id: string, updates: Partial<Omit<TimeEntry, "id" | "createdAt">>) => Promise<void>;
  openEditEntry: (entry: TimeEntry) => void;
  closeEditEntry: () => void;
  addProject: (uid: string, name: string, color: string) => Promise<void>;
}

export const useTrackerStore = create<TrackerState>((set, get) => ({
  projects: [],
  entries: [],
  runningId: null,
  loaded: false,
  editingEntry: null,

  load: async (uid) => {
    const [projSnap, entrySnap] = await Promise.all([
      getDocs(collection(db, "users", uid, "projects")),
      getDocs(collection(db, "users", uid, "timeEntries")),
    ]);
    const entries = entrySnap.docs.map((d) => ({ ...d.data(), tags: d.data().tags ?? [] } as TimeEntry));
    const running = entries.find((e) => e.endAt === null);
    set({ projects: projSnap.docs.map((d) => d.data() as Project), entries, runningId: running?.id ?? null, loaded: true });
  },

  startTimer: async (uid, description, projectId, tag) => {
    await get().stopTimer(uid);
    const id = makeId();
    const startAt = nowISO();
    const entry: TimeEntry = { id, projectId, description, tags: tag ? [tag] : [], startAt, endAt: null, duration: null, createdAt: startAt.slice(0, 10) };
    await setDoc(doc(db, "users", uid, "timeEntries", id), entry);
    set((s) => ({ entries: [entry, ...s.entries], runningId: id }));
  },

  stopTimer: async (uid) => {
    const { runningId } = get();
    if (!runningId) return;
    const endAt = nowISO();
    const entry = get().entries.find((e) => e.id === runningId);
    if (!entry) return;
    const duration = Math.max(Math.floor((parseISO(endAt) - parseISO(entry.startAt)) / 1000), 0);
    await updateDoc(doc(db, "users", uid, "timeEntries", runningId), { endAt, duration });
    set((s) => ({ runningId: null, entries: s.entries.map((e) => e.id === runningId ? { ...e, endAt, duration } : e) }));
  },

  deleteEntry: async (uid, id) => {
    await deleteDoc(doc(db, "users", uid, "timeEntries", id));
    set((s) => ({ entries: s.entries.filter((e) => e.id !== id), runningId: s.runningId === id ? null : s.runningId }));
  },

  updateEntry: async (uid, id, updates) => {
    const recomputed: Partial<TimeEntry> = { ...updates };
    if (updates.startAt || updates.endAt) {
      const entry = get().entries.find((e) => e.id === id);
      const startAt = updates.startAt ?? entry?.startAt ?? "";
      const endAt = updates.endAt ?? entry?.endAt ?? null;
      if (startAt && endAt) {
        recomputed.duration = Math.max(Math.floor((parseISO(endAt) - parseISO(startAt)) / 1000), 0);
      }
    }
    set((s) => ({ entries: s.entries.map((e) => e.id === id ? { ...e, ...recomputed } : e), editingEntry: null }));
    await updateDoc(doc(db, "users", uid, "timeEntries", id), recomputed as Record<string, unknown>);
  },

  openEditEntry: (entry) => set({ editingEntry: entry }),
  closeEditEntry: () => set({ editingEntry: null }),

  addProject: async (uid, name, color) => {
    const id = makeId();
    const project: Project = { id, name, color, archived: false, createdAt: nowISO().slice(0, 10) };
    await setDoc(doc(db, "users", uid, "projects", id), project);
    set((s) => ({ projects: [...s.projects, project] }));
  },
}));

export function fmtDuration(secs: number): string {
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
  if (h === 0 && m === 0) return `${s}s`;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}
export function fmtHHMMSS(secs: number): string {
  return [Math.floor(secs / 3600), Math.floor((secs % 3600) / 60), secs % 60].map((v) => String(v).padStart(2, "0")).join(":");
}
