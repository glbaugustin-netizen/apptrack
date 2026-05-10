"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { MODULES, getModuleFromPath } from "@/lib/modules";
import { ThemeToggle } from "./ThemeToggle";
import { useAuthStore } from "@/lib/store/auth.store";

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const activeModule = getModuleFromPath(pathname);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [menuOpen, setMenuOpen] = useState(false);

  const initials = user?.name
    ? user.name.slice(0, 2).toUpperCase()
    : user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "??";

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        height: 44,
        background: "var(--color-background-primary)",
        borderBottom: "0.5px solid var(--color-border-tertiary)",
        padding: "0 12px",
        flexShrink: 0,
        gap: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          paddingRight: 16,
          borderRight: "0.5px solid var(--color-border-tertiary)",
          marginRight: 4,
          fontWeight: 500,
          fontSize: 14,
          color: "var(--color-text-primary)",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        <i className="ti ti-layout-dashboard" style={{ fontSize: 17, color: "#7F77DD" }} />
        Productivity
      </div>

      {/* Navigation */}
      <nav style={{ display: "flex", alignItems: "center", flex: 1 }}>
        {MODULES.map((module) => {
          const isActive = activeModule.id === module.id;
          return (
            <Link
              key={module.id}
              href={module.path}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "0 12px",
                height: 44,
                color: isActive ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                textDecoration: "none",
                fontSize: 13,
                whiteSpace: "nowrap",
                borderBottom: isActive ? `2px solid ${module.accent}` : "2px solid transparent",
                transition: "color 0.15s, border-color 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-text-primary)";
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-text-secondary)";
              }}
            >
              <i className={`ti ${module.icon}`} style={{ fontSize: 15 }} />
              {module.label}
            </Link>
          );
        })}
      </nav>

      {/* Droite */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, position: "relative" }}>
        <ThemeToggle />
        <div
          onClick={() => setMenuOpen((o) => !o)}
          style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "#EEEDFE", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 500, color: "#534AB7",
            cursor: "pointer", flexShrink: 0, userSelect: "none",
          }}
          title={user?.email ?? "Profil"}
        >
          {initials}
        </div>

        {menuOpen && (
          <div
            style={{
              position: "absolute", top: 36, right: 0, zIndex: 100,
              background: "var(--color-background-primary)",
              border: "0.5px solid var(--color-border-tertiary)",
              borderRadius: "var(--border-radius-md)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              minWidth: 180, padding: "4px 0",
            }}
          >
            {user && (
              <div style={{ padding: "8px 12px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>
                  {user.name ?? "Mon compte"}
                </div>
                <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 1 }}>
                  {user.email}
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                width: "100%", padding: "8px 12px", border: "none",
                background: "transparent", cursor: "pointer",
                fontSize: 13, color: "var(--color-text-secondary)",
                textAlign: "left",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--color-background-secondary)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              <i className="ti ti-logout" style={{ fontSize: 15 }} />
              Se déconnecter
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
