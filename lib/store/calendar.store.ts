import { create } from "zustand";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CalendarEvent } from "@/lib/types/event.types";

function makeId() { return Math.random().toString(36).slice(2, 10); }
function toISO(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }

type CalendarView = "month" | "week" | "day";

interface CalendarState {
  events: CalendarEvent[];
  activeView: CalendarView;
  displayedDate: string;
  isModalOpen: boolean;
  modalInitialDate: string | null;
  loaded: boolean;

  load: (uid: string) => Promise<void>;
  setView: (view: CalendarView) => void;
  navigate: (direction: "prev" | "next") => void;
  navigateMonth: (direction: "prev" | "next") => void;
  goToToday: () => void;
  openModal: (date?: string) => void;
  closeModal: () => void;
  addEvent: (uid: string, data: Omit<CalendarEvent, "id" | "createdAt">) => Promise<void>;
  deleteEvent: (uid: string, id: string) => Promise<void>;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: [],
  activeView: "month",
  displayedDate: toISO(new Date()),
  isModalOpen: false,
  modalInitialDate: null,
  loaded: false,

  load: async (uid) => {
    const snap = await getDocs(collection(db, "users", uid, "events"));
    set({ events: snap.docs.map((d) => d.data() as CalendarEvent), loaded: true });
  },

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
    d.setDate(1); d.setMonth(d.getMonth() + (direction === "next" ? 1 : -1));
    set({ displayedDate: toISO(d) });
  },

  goToToday: () => set({ displayedDate: toISO(new Date()) }),

  openModal: (date) => set({ isModalOpen: true, modalInitialDate: date ?? null }),
  closeModal: () => set({ isModalOpen: false, modalInitialDate: null }),

  addEvent: async (uid, data) => {
    const id = makeId();
    const event: CalendarEvent = { ...data, id, createdAt: toISO(new Date()) };
    await setDoc(doc(db, "users", uid, "events", id), event);
    set((s) => ({ events: [...s.events, event] }));
  },

  deleteEvent: async (uid, id) => {
    await deleteDoc(doc(db, "users", uid, "events", id));
    set((s) => ({ events: s.events.filter((e) => e.id !== id) }));
  },
}));
