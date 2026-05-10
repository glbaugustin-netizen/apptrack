"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTrackerStore } from "@/lib/store/tracker.store";

const NAV_ITEMS = [
  { href: "/tracker",          icon: "ti-sun",          label: "Aujourd'hui" },
  { href: "/tracker/week",     icon: "ti-calendar-week", label: "Cette semaine" },
  { href: "/tracker/projects", icon: "ti-folder",        label: "Projets" },
  { href: "/tracker/stats",    icon: "ti-chart-bar",     label: "Statistiques" },
] as const;

export function TrackerSidebar() {
  const pathname = usePathname();
  const { projects } = useTrackerStore();

  return (
    <>
      <div style={{ padding: "14px 14px 8px", fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Time Tracker
      </div>

      {NAV_ITEMS.map((item) => {
        const active = item.href === "/tracker" ? pathname === "/tracker" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: "flex", alignItems: "center", gap: 9,
              padding: "8px 14px", textDecoration: "none",
              background: active ? "var(--color-background-secondary)" : "transparent",
              color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              fontWeight: active ? 500 : 400, fontSize: 13,
              transition: "background 0.1s, color 0.1s",
            }}
            onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "var(--color-background-secondary)"; e.currentTarget.style.color = "var(--color-text-primary)"; } }}
            onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-text-secondary)"; } }}
          >
            <i className={`ti ${item.icon}`} style={{ fontSize: 16 }} />
            {item.label}
          </Link>
        );
      })}

      {/* Divider */}
      <div style={{ height: "0.5px", background: "var(--color-border-tertiary)", margin: "8px 0" }} />

      {/* Project list */}
      <div style={{ padding: "8px 14px 4px", fontSize: 11, color: "var(--color-text-secondary)" }}>
        Projets
      </div>
      {projects.filter((p) => !p.archived).map((p) => (
        <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: "var(--color-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {p.name}
          </span>
        </div>
      ))}

      {/* CTA */}
      <div style={{ marginTop: "auto", padding: "12px 14px" }}>
        <button
          style={{
            display: "flex", alignItems: "center", gap: 7,
            width: "100%", padding: "7px 10px",
            background: "#1D9E75", color: "#fff",
            border: "none", borderRadius: "var(--border-radius-md)",
            fontSize: 13, cursor: "pointer", fontWeight: 500,
          }}
        >
          <i className="ti ti-plus" style={{ fontSize: 14 }} />
          Nouveau projet
        </button>
      </div>
    </>
  );
}
