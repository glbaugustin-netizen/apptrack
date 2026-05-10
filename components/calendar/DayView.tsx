"use client";

import { useCalendarStore } from "@/lib/store/calendar.store";
import { CATEGORY_CONFIG } from "@/lib/types/event.types";

const TODAY = new Date().toISOString().slice(0, 10);
const MONTH_FR = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const DAY_FR = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const HOUR_HEIGHT = 56;
const START_HOUR = 7;
const END_HOUR = 22;

function eventTopPx(startAt: string): number {
  const [h, m] = startAt.slice(11, 16).split(":").map(Number);
  return (h - START_HOUR + m / 60) * HOUR_HEIGHT;
}

function eventHeightPx(startAt: string, endAt: string): number {
  const [sh, sm] = startAt.slice(11, 16).split(":").map(Number);
  const [eh, em] = endAt.slice(11, 16).split(":").map(Number);
  return Math.max(((eh + em / 60) - (sh + sm / 60)) * HOUR_HEIGHT, 24);
}

function ViewToggle({ activeView, setView }: { activeView: string; setView: (v: "month" | "week" | "day") => void }) {
  return (
    <div style={{ display: "flex", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-md)", overflow: "hidden" }}>
      {(["month", "week", "day"] as const).map((v, i) => {
        const labels = ["Mois", "Semaine", "Jour"];
        const active = activeView === v;
        return (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              padding: "4px 12px", fontSize: 12, cursor: "pointer",
              background: active ? "var(--color-background-secondary)" : "transparent",
              color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              fontWeight: active ? 500 : 400,
              border: "none",
              borderRight: i < 2 ? "0.5px solid var(--color-border-tertiary)" : "none",
            }}
          >
            {labels[i]}
          </button>
        );
      })}
    </div>
  );
}

export function DayView() {
  const { events, displayedDate, activeView, navigate, goToToday, openModal, setView } = useCalendarStore();
  const [year, month, day] = displayedDate.split("-").map(Number);
  const dayName = DAY_FR[new Date(year, month - 1, day).getDay()];
  const isToday = displayedDate === TODAY;
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);
  const totalHeight = hours.length * HOUR_HEIGHT;

  const dayEvents = events.filter((ev) => {
    if (ev.startAt.slice(0, 10) !== displayedDate) return false;
    const h = parseInt(ev.startAt.slice(11, 13));
    return h >= START_HOUR && h <= END_HOUR;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 20px 12px",
        borderBottom: "0.5px solid var(--color-border-tertiary)",
        background: "var(--color-background-primary)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => navigate("prev")} style={{ width: 28, height: 28, border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-md)", background: "transparent", cursor: "pointer", color: "var(--color-text-secondary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
            <i className="ti ti-chevron-left" />
          </button>
          <button onClick={() => navigate("next")} style={{ width: 28, height: 28, border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-md)", background: "transparent", cursor: "pointer", color: "var(--color-text-secondary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
            <i className="ti ti-chevron-right" />
          </button>
          <button onClick={goToToday} style={{ padding: "4px 10px", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-md)", background: "transparent", cursor: "pointer", color: "var(--color-text-secondary)", fontSize: 12 }}>
            Aujourd&apos;hui
          </button>
          <span style={{ fontSize: 16, fontWeight: 500, color: "var(--color-text-primary)" }}>
            {dayName} {day} {MONTH_FR[month - 1]} {year}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ViewToggle activeView={activeView} setView={setView} />
          <button onClick={() => openModal(displayedDate)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "#378ADD", color: "#fff", border: "none", borderRadius: "var(--border-radius-md)", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
            <i className="ti ti-plus" style={{ fontSize: 14 }} />
            Nouvel événement
          </button>
        </div>
      </div>

      {/* Day info bar */}
      <div style={{
        padding: "10px 20px", borderBottom: "0.5px solid var(--color-border-tertiary)",
        background: "var(--color-background-primary)", flexShrink: 0,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{
          width: 32, height: 32, borderRadius: "50%",
          background: isToday ? "#378ADD" : "transparent",
          color: isToday ? "#fff" : "var(--color-text-primary)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, fontWeight: 500, flexShrink: 0,
        }}>
          {day}
        </span>
        <span style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>{dayName}</span>
        {isToday && (
          <span style={{ fontSize: 11, fontWeight: 500, color: "#378ADD", background: "#E6F1FB", padding: "2px 8px", borderRadius: 10 }}>
            Aujourd&apos;hui
          </span>
        )}
        <span style={{ fontSize: 13, color: "var(--color-text-tertiary)", marginLeft: "auto" }}>
          {dayEvents.length} événement{dayEvents.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Time grid */}
      <div style={{ overflowY: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "48px 1fr" }}>
          {/* Hour labels */}
          <div>
            {hours.map((h) => (
              <div key={h} style={{ height: HOUR_HEIGHT, display: "flex", alignItems: "flex-start", paddingTop: 2, paddingRight: 8, justifyContent: "flex-end" }}>
                <span style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>{h}h</span>
              </div>
            ))}
          </div>

          {/* Single day column */}
          <div style={{ position: "relative", borderLeft: "0.5px solid var(--color-border-tertiary)", height: totalHeight }}>
            {hours.map((h) => (
              <div key={h} style={{ position: "absolute", top: (h - START_HOUR) * HOUR_HEIGHT, left: 0, right: 0, height: "0.5px", background: "var(--color-border-tertiary)" }} />
            ))}
            {dayEvents.map((ev) => {
              const cat = CATEGORY_CONFIG[ev.category];
              return (
                <div
                  key={ev.id}
                  style={{
                    position: "absolute", left: 8, right: 8,
                    top: eventTopPx(ev.startAt),
                    height: eventHeightPx(ev.startAt, ev.endAt),
                    background: cat.bg, borderLeft: `3px solid ${ev.color}`,
                    borderRadius: 4, padding: "4px 8px",
                    overflow: "hidden", cursor: "pointer",
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 500, color: cat.text }}>{ev.title}</div>
                  <div style={{ fontSize: 10, color: cat.text, opacity: 0.8 }}>
                    {ev.startAt.slice(11, 16)} – {ev.endAt.slice(11, 16)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
