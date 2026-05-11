"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { MODULES, getModuleFromPath } from "@/lib/modules";
import { ThemeToggle } from "./ThemeToggle";
import { useAuthStore } from "@/lib/store/auth.store";
import { useUIStore } from "@/lib/store/ui.store";

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const activeModule = getModuleFromPath(pathname);
  const { user, logout } = useAuthStore();
  const { toggleSidebar } = useUIStore();

  const displayName = user?.displayName || user?.email || "";
  const initials = displayName
    ? displayName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <header style={{ display: "flex", alignItems: "center", height: 44, background: "var(--color-background-primary)", borderBottom: "0.5px solid var(--color-border-tertiary)", padding: "0 12px", flexShrink: 0 }}>
      {/* Hamburger — mobile only */}
      <button
        className="topbar-hamburger"
        onClick={toggleSidebar}
        style={{ alignItems: "center", justifyContent: "center", width: 32, height: 32, border: "none", background: "transparent", cursor: "pointer", color: "var(--color-text-secondary)", fontSize: 20, marginRight: 8, flexShrink: 0 }}
      >
        <i className="ti ti-menu-2" />
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 7, paddingRight: 16, borderRight: "0.5px solid var(--color-border-tertiary)", marginRight: 4, fontWeight: 500, fontSize: 14, color: "var(--color-text-primary)", whiteSpace: "nowrap", flexShrink: 0 }}>
        <i className="ti ti-layout-dashboard" style={{ fontSize: 17, color: "#7F77DD" }} />
        <span className="topbar-module-label">Productivity</span>
      </div>

      <nav className="topbar-module-nav">
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
              <span className="topbar-module-label">{module.label}</span>
            </Link>
          );
        })}
      </nav>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <ThemeToggle />
        <div style={{ display: "flex", alignItems: "center", gap: 7, paddingLeft: 8, borderLeft: "0.5px solid var(--color-border-tertiary)" }}>
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#7F77DD22", border: "0.5px solid #7F77DD55", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "#7F77DD", flexShrink: 0 }}>
            {initials}
          </div>
          <button
            onClick={handleLogout}
            title="Déconnexion"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "transparent", cursor: "pointer", color: "var(--color-text-secondary)", fontSize: 14 }}
          >
            <i className="ti ti-logout" />
          </button>
        </div>
      </div>
    </header>
  );
}
