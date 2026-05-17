"use client";

import { useState } from "react";
import { useTrackerStore, fmtDuration } from "@/lib/store/tracker.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { TimeEntryEditModal } from "@/components/tracker/TimeEntryEditModal";

const DAY_LONG = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const MONTHS_FR = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

function getWeekISOs(): { iso: string; label: string }[] {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return { iso, label: `${DAY_LONG[i]} ${d.getDate()} ${MONTHS_FR[d.getMonth()]}` };
  });
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function TrackerWeekPage() {
  const { projects, entries, runningId, openEditEntry, deleteEntry } = useTrackerStore();
  const uid = useAuthStore((s) => s.user?.uid ?? "");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const weekDays = getWeekISOs();
  const TODAY = todayISO();

  const totalWeekSecs = weekDays.reduce((sum, { iso }) => {
    return sum + entries
      .filter((e) => e.startAt.slice(0, 10) === iso && e.id !== runningId)
      .reduce((s, e) => s + (e.duration ?? 0), 0);
  }, 0);

  return (
    <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: "var(--color-text-primary)" }}>Cette semaine</h1>
          <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>Total : {fmtDuration(totalWeekSecs)}</p>
        </div>
      </div>

      <TimeEntryEditModal />

      {weekDays.map(({ iso, label }) => {
        const dayEntries = entries
          .filter((e) => e.startAt.slice(0, 10) === iso && e.id !== runningId && e.endAt !== null)
          .sort((a, b) => b.startAt.localeCompare(a.startAt));
        const daySecs = dayEntries.reduce((s, e) => s + (e.duration ?? 0), 0);
        const isToday = iso === TODAY;

        if (dayEntries.length === 0 && !isToday) return null;

        return (
          <div key={iso}>
            {/* Day header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: isToday ? "#1D9E75" : "var(--color-text-primary)" }}>{label}</span>
                {isToday && (
                  <span style={{ fontSize: 10, fontWeight: 500, color: "#1D9E75", background: "#E1F5EE", padding: "2px 7px", borderRadius: 10 }}>
                    Aujourd&apos;hui
                  </span>
                )}
              </div>
              {daySecs > 0 && <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{fmtDuration(daySecs)}</span>}
            </div>

            {dayEntries.length === 0 ? (
              <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", padding: "10px 0" }}>Aucune entrée</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {dayEntries.map((entry) => {
                  const proj = projects.find((p) => p.id === entry.projectId);
                  const isHovered = hoveredId === entry.id;
                  return (
                    <div
                      key={entry.id}
                      onMouseEnter={() => setHoveredId(entry.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--color-background-primary)", border: `0.5px solid ${isHovered ? "var(--color-border-secondary)" : "var(--color-border-tertiary)"}`, borderRadius: "var(--border-radius-md)", padding: "8px 12px", transition: "border-color 0.1s" }}
                    >
                      <div style={{ width: 3, height: 28, borderRadius: 2, background: proj?.color ?? "#888780", flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.description}</div>
                        <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 1 }}>
                          {proj?.name ?? "—"} · {entry.startAt.slice(11, 16)} – {entry.endAt?.slice(11, 16) ?? "en cours"}
                        </div>
                      </div>
                      {entry.tags[0] && (
                        <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: "var(--color-background-secondary)", color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>
                          #{entry.tags[0]}
                        </span>
                      )}
                      <span className="tabular-nums" style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", whiteSpace: "nowrap" }}>
                        {fmtDuration(entry.duration ?? 0)}
                      </span>
                      <div style={{ display: "flex", gap: 4, opacity: isHovered ? 1 : 0, transition: "opacity 0.15s" }}>
                        <button onClick={() => openEditEntry(entry)} style={{ width: 24, height: 24, border: "none", background: "transparent", cursor: "pointer", color: "var(--color-text-secondary)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, fontSize: 13 }} title="Modifier">
                          <i className="ti ti-pencil" />
                        </button>
                        <button onClick={() => deleteEntry(uid, entry.id)} style={{ width: 24, height: 24, border: "none", background: "transparent", cursor: "pointer", color: "var(--color-text-secondary)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, fontSize: 13 }} title="Supprimer">
                          <i className="ti ti-trash" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ height: "0.5px", background: "var(--color-border-tertiary)", marginTop: 12 }} />
          </div>
        );
      })}
    </div>
  );
}
