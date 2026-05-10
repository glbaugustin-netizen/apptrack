export type EventCategory = "work" | "personal" | "health" | "family";

export const CATEGORY_CONFIG: Record<EventCategory, { label: string; color: string; bg: string; text: string }> = {
  work:     { label: "Travail",   color: "#378ADD", bg: "#E6F1FB", text: "#185FA5" },
  personal: { label: "Personnel", color: "#1D9E75", bg: "#E1F5EE", text: "#0F6E56" },
  health:   { label: "Santé",     color: "#D4537E", bg: "#FBEAF0", text: "#993556" },
  family:   { label: "Famille",   color: "#EF9F27", bg: "#FAEEDA", text: "#633806" },
};

export const EVENT_COLORS = [
  "#378ADD", "#7F77DD", "#1D9E75", "#D4537E",
  "#EF9F27", "#D85A30", "#E24B4A", "#888780",
] as const;

export interface CalendarEvent {
  id: string;
  title: string;
  startAt: string;  // "YYYY-MM-DDTHH:MM"
  endAt: string;    // "YYYY-MM-DDTHH:MM"
  allDay: boolean;
  category: EventCategory;
  color: string;
  createdAt: string;
}
