"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getModuleFromPath } from "@/lib/modules";
import { Topbar } from "./Topbar";
import { Sidebar } from "./Sidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { useUIStore } from "@/lib/store/ui.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { useHabitsStore } from "@/lib/store/habits.store";
import { useWorkStore } from "@/lib/store/work.store";
import { useCalendarStore } from "@/lib/store/calendar.store";
import { useTrackerStore } from "@/lib/store/tracker.store";
import { useGradesStore } from "@/lib/store/grades.store";
import { useSkillsStore } from "@/lib/store/skills.store";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const activeModule = getModuleFromPath(pathname);

  const { init, loading } = useAuthStore();
  const { sidebarOpen, closeSidebar } = useUIStore();
  const loadHabits = useHabitsStore((s) => s.load);
  const loadWork = useWorkStore((s) => s.load);
  const loadCalendar = useCalendarStore((s) => s.load);
  const loadTracker = useTrackerStore((s) => s.load);
  const loadGrades = useGradesStore((s) => s.load);
  const loadSkills = useSkillsStore((s) => s.load);

  useEffect(() => {
    const unsub = init((uid) => {
      if (!uid) { router.push("/login"); return; }
      loadHabits(uid);
      loadWork(uid);
      loadCalendar(uid);
      loadTracker(uid);
      loadGrades(uid);
      loadSkills(uid);
    });
    return unsub;
  }, []);

  // Le lobby (page d'accueil) occupe tout l'écran, sans barre ni menu.
  const isLobby = pathname === "/";

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: isLobby ? "#06070A" : "var(--color-background-tertiary)" }}>
        <div style={{ fontSize: 13, color: isLobby ? "#5A5F6E" : "var(--color-text-secondary)" }}>Chargement…</div>
      </div>
    );
  }

  if (isLobby) return <>{children}</>;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--color-background-tertiary)", overflow: "hidden" }}>
      <Topbar />
      <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
        {/* Overlay mobile */}
        {sidebarOpen && (
          <div
            className="mobile-overlay"
            onClick={closeSidebar}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 40 }}
          />
        )}
        {/* Sidebar — drawer sur mobile */}
        <div className={`shell-sidebar-wrapper${sidebarOpen ? " sidebar-open" : ""}`}>
          <Sidebar activeModule={activeModule} />
        </div>
        <main className="shell-main">
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
