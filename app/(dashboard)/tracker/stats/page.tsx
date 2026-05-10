"use client";

import { useState } from "react";
import { useTrackerStore, fmtDuration } from "@/lib/store/tracker.store";

type Period = "week" | "month" | "3months";

const PERIOD_LABELS: Record<Period, string> = {
  week: "Cette semaine",
  month: "Ce mois",
  "3months": "3 mois",
};

function getDateRange(period: Period): { from: string; to: string } {
  const today = new Date();
  const to = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const from = new Date(today);
  if (period === "week") from.setDate(today.getDate() - 6);
  else if (period === "month") from.setDate(today.getDate() - 29);
  else from.setDate(today.getDate() - 89);
  const fromStr = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}-${String(from.getDate()).padStart(2, "0")}`;
  return { from: fromStr, to };
}

function getWeekDays(): { iso: string; label: string }[] {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  const labels = ["L", "M", "M", "J", "V", "S", "D"];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return { iso, label: `${labels[i]} ${d.getDate()}` };
  });
}

// Simple SVG donut chart
function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return <div style={{ width: 150, height: 150, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "var(--color-text-tertiary)" }}>Pas de données</div>;
  }
  const cx = 75, cy = 75, r = 58, innerR = 34;
  let angle = -Math.PI / 2;
  const paths = segments.map((seg) => {
    const slice = (seg.value / total) * Math.PI * 2;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    angle += slice;
    const x2 = cx + r * Math.cos(angle);
    const y2 = cy + r * Math.sin(angle);
    const large = slice > Math.PI ? 1 : 0;
    const d = `M ${cx} ${cy} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`;
    return { ...seg, d };
  });
  return (
    <svg width={150} height={150} viewBox="0 0 150 150">
      {paths.map((p, i) => <path key={i} d={p.d} fill={p.color} />)}
      <circle cx={cx} cy={cy} r={innerR} fill="var(--color-background-primary)" />
    </svg>
  );
}

export default function TrackerStatsPage() {
  const { projects, entries } = useTrackerStore();
  const [period, setPeriod] = useState<Period>("week");

  const { from, to } = getDateRange(period);
  const filteredEntries = entries.filter((e) => {
    const date = e.startAt.slice(0, 10);
    return date >= from && date <= to && e.duration !== null;
  });

  // Per-project breakdown
  const projData = projects
    .filter((p) => !p.archived)
    .map((p) => {
      const secs = filteredEntries
        .filter((e) => e.projectId === p.id)
        .reduce((s, e) => s + (e.duration ?? 0), 0);
      return { ...p, secs };
    })
    .filter((p) => p.secs > 0)
    .sort((a, b) => b.secs - a.secs);

  const totalSecs = projData.reduce((s, p) => s + p.secs, 0);
  const maxProjSecs = Math.max(...projData.map((p) => p.secs), 1);

  // Week bar data (always Mon-Sun for the stacked view)
  const weekDays = getWeekDays();
  const weekMaxSecs = Math.max(
    ...weekDays.map(({ iso }) =>
      filteredEntries.filter((e) => e.startAt.slice(0, 10) === iso).reduce((s, e) => s + (e.duration ?? 0), 0)
    ), 1
  );
  const BAR_MAX_PX = 80;

  // Summary table
  const avgDays = period === "week" ? 7 : period === "month" ? 30 : 90;

  return (
    <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: "var(--color-text-primary)" }}>Statistiques</h1>
          <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>
            {fmtDuration(totalSecs)} sur la période sélectionnée
          </p>
        </div>
        {/* Period selector */}
        <div style={{ display: "flex", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-md)", overflow: "hidden" }}>
          {(["week", "month", "3months"] as Period[]).map((p, i) => {
            const active = period === p;
            return (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                style={{
                  padding: "5px 12px", fontSize: 12, cursor: "pointer",
                  background: active ? "var(--color-background-secondary)" : "transparent",
                  color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                  fontWeight: active ? 500 : 400, border: "none",
                  borderRight: i < 2 ? "0.5px solid var(--color-border-tertiary)" : "none",
                }}
              >
                {PERIOD_LABELS[p]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* Donut chart + legend */}
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 12 }}>Répartition par projet</div>
          {projData.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0", fontSize: 12, color: "var(--color-text-tertiary)" }}>Aucune donnée</div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <DonutChart segments={projData.map((p) => ({ label: p.name, value: p.secs, color: p.color }))} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, minWidth: 0 }}>
                {projData.map((p) => {
                  const pct = totalSecs > 0 ? Math.round((p.secs / totalSecs) * 100) : 0;
                  return (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: "var(--color-text-secondary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-primary)", whiteSpace: "nowrap" }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Weekly bar chart */}
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 12 }}>Par jour (semaine en cours)</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: BAR_MAX_PX + 24 }}>
            {weekDays.map(({ iso, label }) => {
              const daySecs = filteredEntries
                .filter((e) => e.startAt.slice(0, 10) === iso)
                .reduce((s, e) => s + (e.duration ?? 0), 0);
              const barH = daySecs > 0 ? Math.max((daySecs / weekMaxSecs) * BAR_MAX_PX, 3) : 0;
              const today = new Date();
              const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
              const isToday = iso === todayStr;
              return (
                <div key={iso} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                  <span style={{ fontSize: 9, color: isToday ? "#1D9E75" : "var(--color-text-secondary)" }}>
                    {daySecs > 0 ? `${Math.round(daySecs / 360) / 10}h` : ""}
                  </span>
                  <div style={{ display: "flex", alignItems: "flex-end", height: BAR_MAX_PX, width: "100%" }}>
                    <div style={{ width: "100%", height: barH, borderRadius: "3px 3px 0 0", background: isToday ? "#1D9E75" : daySecs > 0 ? "var(--color-border-secondary)" : "transparent" }} />
                  </div>
                  <span style={{ fontSize: 9, color: isToday ? "#1D9E75" : "var(--color-text-secondary)", fontWeight: isToday ? 500 : 400 }}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Project bars */}
      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 12 }}>Temps par projet</div>
        {projData.length === 0 ? (
          <div style={{ textAlign: "center", padding: "16px 0", fontSize: 12, color: "var(--color-text-tertiary)" }}>Aucune donnée pour cette période</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {projData.map((p) => {
              const pct = Math.round((p.secs / maxProjSecs) * 100);
              const pctOfTotal = totalSecs > 0 ? Math.round((p.secs / totalSecs) * 100) : 0;
              return (
                <div key={p.id}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />
                      <span style={{ fontSize: 12, color: "var(--color-text-primary)" }}>{p.name}</span>
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-primary)" }}>{fmtDuration(p.secs)}</span>
                      <span style={{ fontSize: 11, color: "var(--color-text-secondary)", width: 32, textAlign: "right" }}>{pctOfTotal}%</span>
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: p.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary table */}
      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>Récapitulatif</span>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--color-background-secondary)" }}>
              {["Projet", "Heures totales", "% du temps", "Moy. / jour"].map((h) => (
                <th key={h} style={{ padding: "8px 16px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projData.map((p, i) => {
              const pct = totalSecs > 0 ? Math.round((p.secs / totalSecs) * 100) : 0;
              const avgSecs = p.secs / avgDays;
              return (
                <tr key={p.id} style={{ borderTop: i > 0 ? "0.5px solid var(--color-border-tertiary)" : "none" }}>
                  <td style={{ padding: "10px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: "var(--color-text-primary)" }}>{p.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "10px 16px", fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>{fmtDuration(p.secs)}</td>
                  <td style={{ padding: "10px 16px", fontSize: 13, color: "var(--color-text-secondary)" }}>{pct}%</td>
                  <td style={{ padding: "10px 16px", fontSize: 13, color: "var(--color-text-secondary)" }}>{fmtDuration(Math.round(avgSecs))}</td>
                </tr>
              );
            })}
            {projData.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: "16px", textAlign: "center", fontSize: 12, color: "var(--color-text-tertiary)" }}>Aucune donnée pour cette période</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
