"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGradesStore, subjectAverage, sortSubjects } from "@/lib/store/grades.store";
import { useUIStore } from "@/lib/store/ui.store";
import { ACCENT } from "./ui";

function hoverHandlers(active: boolean) {
  return {
    onMouseEnter: (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (!active) { e.currentTarget.style.background = "var(--color-background-secondary)"; e.currentTarget.style.color = "var(--color-text-primary)"; }
    },
    onMouseLeave: (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-text-secondary)"; }
    },
  };
}

export function GradesSidebar() {
  const pathname = usePathname();
  const { subjects, grades, openSubjectModal } = useGradesStore();
  const closeSidebar = useUIStore((s) => s.closeSidebar);

  const overviewActive = pathname === "/grades";

  return (
    <>
      <div style={{ padding: "14px 14px 8px", fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Tracking
      </div>

      <Link
        href="/grades"
        onClick={closeSidebar}
        style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 14px", textDecoration: "none", fontSize: 13, background: overviewActive ? "var(--color-background-secondary)" : "transparent", color: overviewActive ? "var(--color-text-primary)" : "var(--color-text-secondary)", fontWeight: overviewActive ? 500 : 400, transition: "background 0.1s, color 0.1s" }}
        {...hoverHandlers(overviewActive)}
      >
        <i className="ti ti-chart-bar" style={{ fontSize: 16, flexShrink: 0 }} />
        Vue d&apos;ensemble
      </Link>

      <div style={{ height: "0.5px", background: "var(--color-border-tertiary)", margin: "8px 0" }} />

      <div style={{ padding: "4px 14px 6px", fontSize: 11, color: "var(--color-text-secondary)" }}>
        Matières
      </div>

      {sortSubjects(subjects).map((s) => {
        const active = pathname === `/grades/${s.id}` || pathname.startsWith(`/grades/${s.id}/`);
        const avg = subjectAverage(grades.filter((g) => g.subjectId === s.id));
        return (
          <Link
            key={s.id}
            href={`/grades/${s.id}`}
            onClick={closeSidebar}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", textDecoration: "none", fontSize: 13, background: active ? "var(--color-background-secondary)" : "transparent", color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)", fontWeight: active ? 500 : 400, transition: "background 0.1s, color 0.1s" }}
            {...hoverHandlers(active)}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
            <span className="tabular-nums" style={{ fontSize: 11, color: "var(--color-text-secondary)", fontWeight: 400, flexShrink: 0 }}>
              {avg !== null ? avg.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : "—"}
            </span>
          </Link>
        );
      })}

      {subjects.length === 0 && (
        <div style={{ padding: "6px 14px", fontSize: 12, color: "var(--color-text-tertiary)", fontStyle: "italic" }}>
          Aucune matière
        </div>
      )}

      <div style={{ marginTop: "auto", padding: "12px 14px" }}>
        <button
          onClick={() => { closeSidebar(); openSubjectModal(); }}
          style={{ display: "flex", alignItems: "center", gap: 7, width: "100%", padding: "7px 10px", background: ACCENT, color: "#fff", border: "none", borderRadius: "var(--border-radius-md)", fontSize: 13, cursor: "pointer", fontWeight: 500 }}
        >
          <i className="ti ti-plus" style={{ fontSize: 14 }} />
          Nouvelle matière
        </button>
      </div>
    </>
  );
}
