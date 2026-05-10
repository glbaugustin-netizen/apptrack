"use client";

import { useTrackerStore, fmtDuration } from "@/lib/store/tracker.store";

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function TrackerProjectsPage() {
  const { projects, entries } = useTrackerStore();
  const TODAY = todayISO();

  const projectStats = projects
    .filter((p) => !p.archived)
    .map((p) => {
      const projEntries = entries.filter((e) => e.projectId === p.id && e.endAt !== null);
      const totalSecs = projEntries.reduce((s, e) => s + (e.duration ?? 0), 0);
      const lastEntry = projEntries.sort((a, b) => b.startAt.localeCompare(a.startAt))[0];
      const lastDate = lastEntry?.startAt.slice(0, 10) ?? null;
      const isToday = lastDate === TODAY;
      return { ...p, totalSecs, lastDate, isToday, entryCount: projEntries.length };
    });

  const totalSecs = projectStats.reduce((s, p) => s + p.totalSecs, 0);

  return (
    <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 500, color: "var(--color-text-primary)" }}>Projets</h1>
        <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>
          {projectStats.length} projets · {fmtDuration(totalSecs)} au total
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
        {projectStats.map((p) => {
          const pct = totalSecs > 0 ? Math.round((p.totalSecs / totalSecs) * 100) : 0;
          return (
            <div
              key={p.id}
              style={{
                background: "var(--color-background-primary)",
                border: "0.5px solid var(--color-border-tertiary)",
                borderRadius: "var(--border-radius-lg)",
                padding: 16,
                display: "flex", flexDirection: "column", gap: 10,
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: p.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <i className="ti ti-folder" style={{ fontSize: 16, color: "#fff" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{p.entryCount} session{p.entryCount !== 1 ? "s" : ""}</div>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>Temps total</span>
                  <span style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-primary)" }}>{pct}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${pct}%`, background: p.color }} />
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 500, color: "var(--color-text-primary)" }}>{fmtDuration(p.totalSecs)}</div>
                  <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>temps total</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: p.isToday ? "#1D9E75" : "var(--color-text-secondary)", fontWeight: p.isToday ? 500 : 400 }}>
                    {p.isToday ? "Aujourd'hui" : p.lastDate ?? "—"}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>dernière activité</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
