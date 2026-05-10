import { create } from "zustand";
import { Task } from "@/lib/types/task.types";

function makeId() { return Math.random().toString(36).slice(2, 10); }

interface WorkState {
  tasks: Task[];
  isModalOpen: boolean;
  modalInitialDate: string | null;

  openModal: (date?: string) => void;
  closeModal: () => void;
  addTask: (data: Pick<Task, "title" | "priority" | "status" | "dueDate">) => void;
  updateTask: (id: string, updates: Partial<Omit<Task, "id" | "createdAt">>) => void;
  deleteTask: (id: string) => void;
  toggleDone: (id: string) => void;
  reorderTasks: (tasks: Task[]) => void;
}

export const useWorkStore = create<WorkState>((set, get) => ({
  tasks: [],
  isModalOpen: false,
  modalInitialDate: null,

  openModal: (date) => set({ isModalOpen: true, modalInitialDate: date ?? null }),
  closeModal: () => set({ isModalOpen: false, modalInitialDate: null }),

  addTask: (data) => {
    const sameDateCount = get().tasks.filter((t) => t.dueDate === data.dueDate).length;
    const task: Task = {
      id: makeId(),
      title: data.title,
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate,
      order: sameDateCount,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    set((s) => ({ tasks: [...s.tasks, task] }));
  },

  updateTask: (id, updates) =>
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)) })),

  deleteTask: (id) =>
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

  toggleDone: (id) =>
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id ? { ...t, status: t.status === "done" ? "todo" : "done" } : t
      ),
    })),

  reorderTasks: (tasks) => set({ tasks }),
}));
