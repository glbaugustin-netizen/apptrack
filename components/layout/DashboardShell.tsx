"use client";

import { usePathname } from "next/navigation";
import { getModuleFromPath } from "@/lib/modules";
import { Topbar } from "./Topbar";
import { Sidebar } from "./Sidebar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeModule = getModuleFromPath(pathname);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--color-background-tertiary)", overflow: "hidden" }}>
      <Topbar />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar activeModule={activeModule} />
        <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden", background: "var(--color-background-tertiary)" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
