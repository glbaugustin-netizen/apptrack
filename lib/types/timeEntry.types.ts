export interface Project {
  id: string;
  name: string;
  color: string;
  archived: boolean;
  createdAt: string;
}

export interface TimeEntry {
  id: string;
  projectId: string | null;
  description: string;
  tags: string[];
  startAt: string;      // "YYYY-MM-DDTHH:MM"
  endAt: string | null; // null = en cours
  duration: number | null; // secondes
  createdAt: string;
}

export const PROJECT_COLORS = [
  "#378ADD", "#7F77DD", "#1D9E75", "#D4537E",
  "#EF9F27", "#D85A30", "#E24B4A", "#888780",
] as const;
