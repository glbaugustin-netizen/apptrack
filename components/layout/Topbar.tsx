"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MODULES, getModuleFromPath } from "@/lib/modules";
import { ThemeToggle } from "./ThemeToggle";

export function Topbar() {
  const pathname = usePathname();
  const activeModule = getModuleFromPath(pathname);

  return (
    <header style={{ display: "flex", alignItems: "center", height: 44, background: "var(--color-background-primary)", borderBottom: "0.5px solid var(--color-border-tertiary)", padding: "0 12px", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, paddingRight: 16, borderRight: "0.5px solid var(--color-border-tertiary)", marginRight: 4, fontWeight: 500, fontSize: 14, color: "var(--color-text-primary)", whiteSpace: "nowrap", flexShrink: 0 }}>
        <i className="ti ti-layout-dashboard" style={{ fontSize: 17, color: "#7F77DD" }} />
        Productivity
      </div>

      <nav style={{ display: "flex", alignItems: "center", flex: 1 }}>
        {MODULES.map((module) => {
          const isActive = activeModule.id === module.id;
          return (
            <Link
              key={module.id}
              href={module.path}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 12px", height: 44, color: isActive ? "var(--color-text-primary)" : "var(--color-text-secondary)", textDecoration: "none", fontSize: 13, whiteSpace: "nowrap", borderBottom: isActive ? `2px solid ${module.accent}` : "2px solid transparent", transition: "color 0.15s, border-color 0.15s" }}
              onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-text-primary)"; }}
              onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-text-secondary)"; }}
            >
              <i className={`ti ${module.icon}`} style={{ fontSize: 15 }} />
              {module.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <ThemeToggle />
      </div>
    </header>
  );
}
