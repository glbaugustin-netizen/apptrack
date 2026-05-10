export type ModuleId = "habits" | "work" | "calendar" | "tracker";

export interface Module {
  id: ModuleId;
  label: string;
  icon: string;
  accent: string;
  accentPastel: string;
  accentDark: string;
  path: string;
}

export const MODULES: Module[] = [
  {
    id: "habits",
    label: "Habitudes",
    icon: "ti-repeat",
    accent: "#7F77DD",
    accentPastel: "#EEEDFE",
    accentDark: "#534AB7",
    path: "/habits",
  },
  {
    id: "work",
    label: "Travail",
    icon: "ti-briefcase",
    accent: "#D85A30",
    accentPastel: "#FAECE7",
    accentDark: "#993C1D",
    path: "/work",
  },
  {
    id: "calendar",
    label: "Calendrier",
    icon: "ti-calendar",
    accent: "#378ADD",
    accentPastel: "#E6F1FB",
    accentDark: "#185FA5",
    path: "/calendar",
  },
  {
    id: "tracker",
    label: "Time Tracker",
    icon: "ti-clock",
    accent: "#1D9E75",
    accentPastel: "#E1F5EE",
    accentDark: "#0F6E56",
    path: "/tracker",
  },
];

export function getModuleFromPath(pathname: string): Module {
  const found = MODULES.find((m) => pathname.startsWith(m.path));
  return found ?? MODULES[0];
}
