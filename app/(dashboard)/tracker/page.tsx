"use client";

import { useState, useEffect } from "react";
import { useTrackerStore, fmtDuration, fmtHHMMSS } from "@/lib/store/tracker.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { ChronoCard } from "@/components/tracker/ChronoCard";

const DAY_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const DAY_LABELS_MON = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function getWeekISOs(): string[] {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateFr(): string {
  const d = new Date();
  const day = DAY_FR[d.getDay()];
  const months = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  return `${day} ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function TrackerPage() {
  const { projects, entries, runningId, deleteEntry } = useTrackerStore();
  const uid = useAuthStore((s) => s.user?.uid ?? "");
  const [runningElapsed, setRunningElapsed] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const TODAY = todayISO();
  const weekISOs = getWeekISOs();

  const todayEntries = entries
    .filter((e) => e.startAt.slice(0, 10) === TODAY)
    .sort((a, b) => b.startAt.localeCompare(a.startAt));

  const runningEntry = entries.find((e) => e.id === runningId) ?? null;

  // Update elapsed for running indicator in metrics
  useEffect(() => {
    if (!runningEntry) { setRunningElapsed(0); return; }
    const update = () => {
      const start = new Date(runningEntry.startAt + ":00").getTime();
      setRunningElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [runningEntry?.id, runningEntry?.startAt]);

  // Metrics
  const completedSecondsToday = todayEntries
    .filter((e) => e.endAt !== null)
    .reduce((s, e) => s + (e.duration ?? 0), 0);
  const totalSecondsToday = completedSecondsToday + (runningEntry ? runningElapsed : 0);

  const weekEntries = entries.filter((e) => weekISOs.includes(e.startAt.slice(0, 10)));
  const weekSeconds = weekEntries.reduce((s, e) => {
    if (e.id === runningId) return s + runningElapsed;
    return s + (e.duration ?? 0);
  }, 0);

  // Projet principal
  const projSeconds = new Map<string, number>();
  for (const e of todayEntries) {
    if (!e.projectId) continue;
    const sec = e.id === runningId ? runningElapsed : (e.duration ?? 0);
    projSeconds.set(e.projectId, (projSeconds.get(e.projectId) ?? 0) + sec);
  }
  let mainProjId = "";
  let mainProjSecs = 0;
  projSeconds.forEach((secs, pid) => { if (secs > mainProjSecs) { mainProjSecs = secs; mainProjId = pid; } });
  const mainProj = projects.find((p) => p.id === mainProjId);
  const mainProjPct = totalSecondsToday > 0 ? Math.round((mainProjSecs / totalSecondsToday) * 100) : 0;

  // Week bars (Mon → Sun)
  const weekData = weekISOs.map((iso, i) => {
    const dayEntries = entries.filter((e) => e.startAt.slice(0, 10) === iso);
    const secs = dayEntries.reduce((s, e) => {
      if (e.id === runningId) return s + runningElapsed;
      return s + (e.duration ?? 0);
    }, 0);
    return { label: DAY_LABELS_MON[i], hours: secs / 3600, isToday: iso === TODAY };
  });
  const maxHours = Math.max(...weekData.map((d) => d.hours), 1);
  const BAR_MAX_PX = 44;

  return (
    <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 500, color: "var(--color-text-primary)" }}>Aujourd&apos;hui</h1>
        <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>
          {formatDateFr()} · {fmtDuration(totalSecondsToday)} trackées
        </p>
      </div>

      {/* Chrono */}
      <ChronoCard />

      {/* 4 metric cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8 }}>
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-md)", padding: "10px 12px" }}>
          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 3 }}>Aujourd&apos;hui</div>
          <div style={{ fontSize: 20, fontWeight: 500, color: "var(--color-text-primary)", lineHeight: 1.2 }}>{fmtDuration(totalSecondsToday)}</div>
          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>trackées</div>
        </div>
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-md)", padding: "10px 12px" }}>
          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 3 }}>Cette semaine</div>
          <div style={{ fontSize: 20, fontWeight: 500, color: "var(--color-text-primary)", lineHeight: 1.2 }}>{fmtDuration(weekSeconds)}</div>
          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>sur 40h objectif</div>
        </div>
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-md)", padding: "10px 12px" }}>
          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 3 }}>Projet principal</div>
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)", lineHeight: 1.2, paddingTop: 4 }}>{mainProj?.name ?? "—"}</div>
          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>{mainProjPct}% du temps</div>
        </div>
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-md)", padding: "10px 12px" }}>
          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 3 }}>Entrées aujourd&apos;hui</div>
          <div style={{ fontSize: 20, fontWeight: 500, color: "var(--color-text-primary)", lineHeight: 1.2 }}>{todayEntries.length}</div>
          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>sessions</div>
        </div>
      </div>

      {/* Entry list */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>Entrées du jour</span>
          <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>Total : {fmtDuration(totalSecondsToday)}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {todayEntries.map((entry) => {
            const proj = projects.find((p) => p.id === entry.projectId);
            const isRunning = entry.id === runningId;
            const durSecs = isRunning ? runningElapsed : (entry.duration ?? 0);
            return (
              <div
                key={entry.id}
                onMouseEnter={() => setHoveredId(entry.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "var(--color-background-primary)",
                  border: `0.5px solid ${hoveredId === entry.id ? "var(--color-border-secondary)" : "var(--color-border-tertiary)"}`,
                  borderRadius: "var(--border-radius-md)",
                  padding: "9px 12px",
                  transition: "border-color 0.1s",
                }}
              >
                <div style={{ width: 3, height: 32, borderRadius: 2, background: proj?.color ?? "#888780", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {entry.description}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 1 }}>
                    {proj?.name ?? "—"} · {entry.startAt.slice(11, 16)}{entry.endAt ? ` – ${entry.endAt.slice(11, 16)}` : " – en cours"}
                  </div>
                </div>
                {entry.tags[0] && (
                  <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: "var(--color-background-secondary)", color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>
                    #{entry.tags[0]}
                  </span>
                )}
                <span className="tabular-nums" style={{ fontSize: 13, fontWeight: 500, color: isRunning ? "#1D9E75" : "var(--color-text-primary)", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>
                  {isRunning ? fmtHHMMSS(durSecs) : fmtDuration(durSecs)}
                  {isRunning && <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#1D9E75", display: "inline-block" }} />}
                </span>
                <div style={{ display: "flex", gap: 4, opacity: hoveredId === entry.id ? 1 : 0, transition: "opacity 0.15s" }}>
                  <button onClick={() => deleteEntry(uid, entry.id)} style={{ width: 24, height: 24, border: "none", background: "transparent", cursor: "pointer", color: "var(--color-text-secondary)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, fontSize: 13 }}>
                    <i className="ti ti-trash" />
                  </button>
                </div>
              </div>
            );
          })}
          {todayEntries.length === 0 && (
            <div style={{ padding: "20px 0", textAlign: "center", fontSize: 13, color: "var(--color-text-tertiary)" }}>
              Aucune entrée aujourd&apos;hui — démarre le chrono !
            </div>
          )}
        </div>
      </div>

      {/* Week bar chart */}
      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-md)", padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-primary)" }}>Résumé de la semaine</span>
          <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{fmtDuration(weekSeconds)} / 40h objectif</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 68 }}>
          {weekData.map((bar) => {
            const barH = bar.hours > 0 ? Math.max((bar.hours / maxHours) * BAR_MAX_PX, 3) : 0;
            return (
              <div key={bar.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <span style={{ fontSize: 9, color: bar.isToday ? "#1D9E75" : "var(--color-text-secondary)" }}>
                  {bar.hours > 0 ? `${Math.round(bar.hours * 10) / 10}h` : "—"}
                </span>
                <div style={{ display: "flex", alignItems: "flex-end", height: BAR_MAX_PX, width: "100%" }}>
                  <div style={{ width: "100%", height: barH, borderRadius: "3px 3px 0 0", background: bar.isToday ? "#1D9E75" : bar.hours > 0 ? "var(--color-border-secondary)" : "transparent", minHeight: bar.hours > 0 ? 2 : 0 }} />
                </div>
                <span style={{ fontSize: 9, color: bar.isToday ? "#1D9E75" : "var(--color-text-secondary)", fontWeight: bar.isToday ? 500 : 400 }}>
                  {bar.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
