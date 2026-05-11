"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Module } from "@/lib/modules";
import { HabitsSidebar } from "@/components/habits/HabitsSidebar";
import { WorkSidebar } from "@/components/work/WorkSidebar";
import { CalendarSidebar } from "@/components/calendar/CalendarSidebar";
import { TrackerSidebar } from "@/components/tracker/TrackerSidebar";

interface SidebarItemProps {
  href: string;
  icon: string;
  label: string;
  badge?: number;
  dot?: string;
  accent: string;
  accentPastel: string;
  accentDark: string;
}

function SidebarItem({
  href,
  icon,
  label,
  badge,
  dot,
  accent,
  accentPastel,
  accentDark,
}: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "8px 14px",
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
          (e.currentTarget as HTMLAnchorElement).style.background =
            "var(--color-background-secondary)";
          (e.currentTarget as HTMLAnchorElement).style.color =
            "var(--color-text-primary)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
          (e.currentTarget as HTMLAnchorElement).style.color =
            "var(--color-text-secondary)";
        }
      }}
    >
      {dot && (
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: dot,
            flexShrink: 0,
          }}
        />
      )}
      {!dot && icon && (
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
            background: accentPastel,
            color: accentDark,
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

function SidebarDivider() {
  return (
    <div
      style={{
        height: "0.5px",
        background: "var(--color-border-tertiary)",
        margin: "8px 0",
      }}
    />
  );
}

function SidebarHeader({ children }: { children: React.ReactNode }) {
  return (
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
      {children}
    </div>
  );
}

// All module sidebars are store-connected — imported from their component files

interface SidebarProps {
  activeModule: Module;
}

export function Sidebar({ activeModule }: SidebarProps) {
  return (
    <aside className="shell-sidebar">
      {activeModule.id === "habits" && <HabitsSidebar />}
      {activeModule.id === "work" && <WorkSidebar />}
      {activeModule.id === "calendar" && <CalendarSidebar />}
      {activeModule.id === "tracker" && <TrackerSidebar />}
    </aside>
  );
}
