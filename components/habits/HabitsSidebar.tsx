"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useHabitsStore } from "@/lib/store/habits.store";

function NavItem({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "8px 14px",
        textDecoration: "none",
        fontSize: 13,
        color: isActive ? "var(--color-text-primary)" : "var(--color-text-secondary)",
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
      <i className={`ti ${icon}`} style={{ fontSize: 16, flexShrink: 0 }} />
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {label}
      </span>
    </Link>
  );
}

export function HabitsSidebar() {
  const { habits, openModal } = useHabitsStore();

  return (
    <>
      {/* Section navigation */}
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
        Habitudes
      </div>
      <NavItem href="/habits" icon="ti-sun" label="Aujourd'hui" />
      <NavItem href="/habits/stats" icon="ti-chart-bar" label="Statistiques" />

      {/* Séparateur */}
      <div
        style={{
          height: "0.5px",
          background: "var(--color-border-tertiary)",
          margin: "8px 0",
        }}
      />

      {/* Liste rapide des habitudes */}
      <div
        style={{
          padding: "4px 14px 6px",
          fontSize: 11,
          color: "var(--color-text-secondary)",
        }}
      >
        Mes habitudes
      </div>
      {habits
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((h) => (
          <div
            key={h.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              cursor: "pointer",
              transition: "background 0.1s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.background =
                "var(--color-background-secondary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = "transparent";
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: h.color,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 13,
                color: "var(--color-text-secondary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {h.name}
            </span>
          </div>
        ))}

      {/* CTA */}
      <div style={{ marginTop: "auto", padding: "12px 14px" }}>
        <button
          onClick={openModal}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            width: "100%",
            padding: "7px 10px",
            background: "#7F77DD",
            color: "#fff",
            border: "none",
            borderRadius: "var(--border-radius-md)",
            fontSize: 13,
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          <i className="ti ti-plus" style={{ fontSize: 14 }} />
          Nouvelle habitude
        </button>
      </div>
    </>
  );
}
