import { create } from "zustand";
import { Task } from "@/lib/types/task.types";
import { apiFetch } from "@/lib/api";

interface WorkState {
  tasks: Task[];
  isModalOpen: boolean;
  modalInitialDate: string | null;
  loaded: boolean;

  load: () => Promise<void>;
  openModal: (date?: string) => void;
  closeModal: () => void;
  addTask: (data: Pick<Task, "title" | "priority" | "status" | "dueDate">) => Promise<void>;
  updateTask: (id: string, updates: Partial<Omit<Task, "id" | "createdAt">>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleDone: (id: string) => Promise<void>;
  reorderTasks: (tasks: Task[]) => void;
}

export const useWorkStore = create<WorkState>((set, get) => ({
  tasks: [],
  isModalOpen: false,
  modalInitialDate: null,
  loaded: false,

  load: async () => {
    if (get().loaded) return;
    const { tasks } = await apiFetch<{ tasks: Task[] }>("/api/tasks");
    set({ tasks, loaded: true });
  },

  openModal: (date) => set({ isModalOpen: true, modalInitialDate: date ?? null }),
  closeModal: () => set({ isModalOpen: false, modalInitialDate: null }),

  addTask: async (data) => {
    const { task } = await apiFetch<{ task: Task }>("/api/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    });
    set((s) => ({ tasks: [...s.tasks, task] }));
  },

  updateTask: async (id, updates) => {
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
    await apiFetch(`/api/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  deleteTask: async (id) => {
    await apiFetch(`/api/tasks/${id}`, { method: "DELETE" });
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
  },

  toggleDone: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    const newStatus = task.status === "done" ? "todo" : "done";
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, status: newStatus } : t)),
    }));
    await apiFetch(`/api/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status: newStatus }),
    });
  },

  reorderTasks: (tasks) => set({ tasks }),
}));
