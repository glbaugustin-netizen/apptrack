"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getModuleFromPath } from "@/lib/modules";
import { Topbar } from "./Topbar";
import { Sidebar } from "./Sidebar";
import { useAuthStore } from "@/lib/store/auth.store";
import { useHabitsStore } from "@/lib/store/habits.store";
import { useWorkStore } from "@/lib/store/work.store";
import { useCalendarStore } from "@/lib/store/calendar.store";
import { useTrackerStore } from "@/lib/store/tracker.store";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeModule = getModuleFromPath(pathname);
  const init = useAuthStore((s) => s.init);
  const loadHabits = useHabitsStore((s) => s.load);
  const loadWork = useWorkStore((s) => s.load);
  const loadCalendar = useCalendarStore((s) => s.load);
  const loadTracker = useTrackerStore((s) => s.load);

  useEffect(() => {
    init();
    loadHabits();
    loadWork();
    loadCalendar();
    loadTracker();
  }, [init, loadHabits, loadWork, loadCalendar, loadTracker]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "var(--color-background-tertiary)",
        overflow: "hidden",
      }}
    >
      <Topbar />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar activeModule={activeModule} />
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            background: "var(--color-background-tertiary)",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
