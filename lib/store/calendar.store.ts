import { create } from "zustand";
import { CalendarEvent } from "@/lib/types/event.types";

function makeId() { return Math.random().toString(36).slice(2, 10); }
function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type CalendarView = "month" | "week" | "day";

interface CalendarState {
  events: CalendarEvent[];
  activeView: CalendarView;
  displayedDate: string;
  isModalOpen: boolean;
  modalInitialDate: string | null;

  setView: (view: CalendarView) => void;
  navigate: (direction: "prev" | "next") => void;
  navigateMonth: (direction: "prev" | "next") => void;
  goToToday: () => void;
  openModal: (date?: string) => void;
  closeModal: () => void;
  addEvent: (data: Omit<CalendarEvent, "id" | "createdAt">) => void;
  deleteEvent: (id: string) => void;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: [],
  activeView: "month",
  displayedDate: toISO(new Date()),
  isModalOpen: false,
  modalInitialDate: null,

  setView: (view) => set({ activeView: view }),

  navigate: (direction) => {
    const { activeView, displayedDate } = get();
    const d = new Date(displayedDate + "T12:00:00");
    const delta = direction === "next" ? 1 : -1;
    if (activeView === "month") { d.setDate(1); d.setMonth(d.getMonth() + delta); }
    else if (activeView === "week") d.setDate(d.getDate() + delta * 7);
    else d.setDate(d.getDate() + delta);
    set({ displayedDate: toISO(d) });
  },

  navigateMonth: (direction) => {
    const d = new Date(get().displayedDate + "T12:00:00");
    d.setDate(1);
    d.setMonth(d.getMonth() + (direction === "next" ? 1 : -1));
    set({ displayedDate: toISO(d) });
  },

  goToToday: () => set({ displayedDate: toISO(new Date()) }),

  openModal: (date) => set({ isModalOpen: true, modalInitialDate: date ?? null }),
  closeModal: () => set({ isModalOpen: false, modalInitialDate: null }),

  addEvent: (data) => {
    const event: CalendarEvent = { ...data, id: makeId(), createdAt: toISO(new Date()) };
    set((s) => ({ events: [...s.events, event] }));
  },

  deleteEvent: (id) =>
    set((s) => ({ events: s.events.filter((e) => e.id !== id) })),
}));
