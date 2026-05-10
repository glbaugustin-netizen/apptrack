"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useWorkStore } from "@/lib/store/work.store";

const TODAY = new Date().toISOString().slice(0, 10);

function getWeekBounds(iso: string): [string, string] {
  const d = new Date(iso + "T12:00:00Z");
  const day = d.getUTCDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setUTCDate(d.getUTCDate() + diffToMon);
  const sun = new Date(mon);
  sun.setUTCDate(mon.getUTCDate() + 6);
  return [mon.toISOString().slice(0, 10), sun.toISOString().slice(0, 10)];
}

interface NavItemProps {
  href: string;
  icon?: string;
  dot?: string;
  label: string;
  badge?: number;
  badgeActive?: boolean;
  exact?: boolean;
}

function NavItem({ href, icon, dot, label, badge, badgeActive, exact }: NavItemProps) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname === href;

  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: dot ? 8 : 9,
        padding: dot ? "6px 14px" : "8px 14px",
        cursor: "pointer",
        color: isActive ? "var(--color-text-primary)" : "var(--color-text-secondary)",
        fontSize: 13,
        textDecoration: "none",
        background: isActive ? "var(--color-background-secondary)" : "transparent",
        fontWeight: isActive ? 500 : 400,
        transition: "background 0.1s, color 0.1s",
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLAnchorElement).style.background = "var(--color-background-secondary)";
          (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-text-primary)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
          (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-text-secondary)";
        }
      }}
    >
      {dot ? (
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: dot, flexShrink: 0 }} />
      ) : (
        <i className={`ti ${icon}`} style={{ fontSize: 16, flexShrink: 0 }} />
      )}
      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {label}
      </span>
      {badge !== undefined && (
        <span
          style={{
            minWidth: 18,
            height: 18,
            borderRadius: 20,
            background: badgeActive ? "#FAECE7" : "var(--color-background-secondary)",
            color: badgeActive ? "#993C1D" : "var(--color-text-secondary)",
            fontSize: 10,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 4px",
            flexShrink: 0,
          }}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

export function WorkSidebar() {
  const { tasks, openModal } = useWorkStore();

  const [weekStart, weekEnd] = useMemo(() => getWeekBounds(TODAY), []);

  const todayRemaining = useMemo(
    () => tasks.filter((t) => t.dueDate === TODAY && t.status !== "done").length,
    [tasks]
  );

  const weekCount = useMemo(
    () => tasks.filter((t) => t.dueDate && t.dueDate >= weekStart && t.dueDate <= weekEnd).length,
    [tasks, weekStart, weekEnd]
  );

  const backlogCount = useMemo(() => tasks.filter((t) => t.dueDate === null).length, [tasks]);

  return (
    <>
      <div
        style={{
          padding: "14px 14px 8px",
          fontSize: 11,
          fontWeight: 500,
          color: "var(--color-text-secondary)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        Travail
      </div>

      <NavItem href="/work" icon="ti-sun" label="Aujourd'hui" badge={todayRemaining} badgeActive exact />
      <NavItem href="/work/week" icon="ti-calendar-week" label="Cette semaine" badge={weekCount} exact />
      <NavItem href="/work/backlog" icon="ti-inbox" label="Backlog" badge={backlogCount} exact />
      <NavItem href="/work/stats" icon="ti-chart-bar" label="Statistiques" exact />

      <div style={{ height: "0.5px", background: "var(--color-border-tertiary)", margin: "8px 0" }} />

      <div style={{ padding: "8px 14px 4px", fontSize: 11, color: "var(--color-text-secondary)" }}>
        Filtres rapides
      </div>
      <NavItem href="/work" dot="#E24B4A" label="Haute priorité" />
      <NavItem href="/work" dot="#378ADD" label="En cours" />
      <NavItem href="/work" dot="#639922" label="Terminées" />

      <div style={{ marginTop: "auto", padding: "12px 14px" }}>
        <button
          onClick={() => openModal(TODAY)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            width: "100%",
            padding: "7px 10px",
            background: "#D85A30",
            color: "#fff",
            border: "none",
            borderRadius: "var(--border-radius-md)",
            fontSize: 13,
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          <i className="ti ti-plus" style={{ fontSize: 14 }} />
          Nouvelle tâche
        </button>
      </div>
    </>
  );
}
