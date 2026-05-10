import { create } from "zustand";
import { CalendarEvent } from "@/lib/types/event.types";
import { apiFetch } from "@/lib/api";

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function todayISO(): string {
  return toISO(new Date());
}

type CalendarView = "month" | "week" | "day";

interface CalendarState {
  events: CalendarEvent[];
  activeView: CalendarView;
  displayedDate: string;
  isModalOpen: boolean;
  modalInitialDate: string | null;
  loaded: boolean;

  load: () => Promise<void>;
  setView: (view: CalendarView) => void;
  navigate: (direction: "prev" | "next") => void;
  navigateMonth: (direction: "prev" | "next") => void;
  goToToday: () => void;
  openModal: (date?: string) => void;
  closeModal: () => void;
  addEvent: (data: Omit<CalendarEvent, "id" | "createdAt">) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: [],
  activeView: "month",
  displayedDate: todayISO(),
  isModalOpen: false,
  modalInitialDate: null,
  loaded: false,

  load: async () => {
    if (get().loaded) return;
    const { events } = await apiFetch<{ events: CalendarEvent[] }>("/api/events");
    set({ events, loaded: true });
  },

  setView: (view) => set({ activeView: view }),

  navigate: (direction) => {
    const { activeView, displayedDate } = get();
    const d = new Date(displayedDate + "T12:00:00");
    const delta = direction === "next" ? 1 : -1;
    if (activeView === "month") {
      d.setDate(1);
      d.setMonth(d.getMonth() + delta);
    } else if (activeView === "week") {
      d.setDate(d.getDate() + delta * 7);
    } else {
      d.setDate(d.getDate() + delta);
    }
    set({ displayedDate: toISO(d) });
  },

  navigateMonth: (direction) => {
    const d = new Date(get().displayedDate + "T12:00:00");
    d.setDate(1);
    d.setMonth(d.getMonth() + (direction === "next" ? 1 : -1));
    set({ displayedDate: toISO(d) });
  },

  goToToday: () => set({ displayedDate: todayISO() }),

  openModal: (date) => set({ isModalOpen: true, modalInitialDate: date ?? null }),
  closeModal: () => set({ isModalOpen: false, modalInitialDate: null }),

  addEvent: async (data) => {
    const { event } = await apiFetch<{ event: CalendarEvent }>("/api/events", {
      method: "POST",
      body: JSON.stringify(data),
    });
    set((s) => ({ events: [...s.events, event] }));
  },

  deleteEvent: async (id) => {
    await apiFetch(`/api/events/${id}`, { method: "DELETE" });
    set((s) => ({ events: s.events.filter((e) => e.id !== id) }));
  },
}));
