import { create } from "zustand";
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Task } from "@/lib/types/task.types";

function makeId() { return Math.random().toString(36).slice(2, 10); }

interface WorkState {
  tasks: Task[];
  isModalOpen: boolean;
  modalInitialDate: string | null;
  loaded: boolean;

  load: (uid: string) => Promise<void>;
  openModal: (date?: string) => void;
  closeModal: () => void;
  addTask: (uid: string, data: Pick<Task, "title" | "priority" | "status" | "dueDate">) => Promise<void>;
  updateTask: (uid: string, id: string, updates: Partial<Omit<Task, "id" | "createdAt">>) => Promise<void>;
  deleteTask: (uid: string, id: string) => Promise<void>;
  toggleDone: (uid: string, id: string) => Promise<void>;
  reorderTasks: (tasks: Task[]) => void;
}

export const useWorkStore = create<WorkState>((set, get) => ({
  tasks: [],
  isModalOpen: false,
  modalInitialDate: null,
  loaded: false,

  load: async (uid) => {
    const snap = await getDocs(collection(db, "users", uid, "tasks"));
    set({ tasks: snap.docs.map((d) => d.data() as Task), loaded: true });
  },

  openModal: (date) => set({ isModalOpen: true, modalInitialDate: date ?? null }),
  closeModal: () => set({ isModalOpen: false, modalInitialDate: null }),

  addTask: async (uid, data) => {
    const id = makeId();
    const task: Task = { id, title: data.title, status: data.status, priority: data.priority, dueDate: data.dueDate, order: get().tasks.filter((t) => t.dueDate === data.dueDate).length, createdAt: new Date().toISOString().slice(0, 10) };
    await setDoc(doc(db, "users", uid, "tasks", id), task);
    set((s) => ({ tasks: [...s.tasks, task] }));
  },

  updateTask: async (uid, id, updates) => {
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)) }));
    await updateDoc(doc(db, "users", uid, "tasks", id), updates as Record<string, unknown>);
  },

  deleteTask: async (uid, id) => {
    await deleteDoc(doc(db, "users", uid, "tasks", id));
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
  },

  toggleDone: async (uid, id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    const newStatus = task.status === "done" ? "todo" : "done";
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, status: newStatus } : t)) }));
    await updateDoc(doc(db, "users", uid, "tasks", id), { status: newStatus });
  },

  reorderTasks: (tasks) => set({ tasks }),
}));
