"use client";

import { useCalendarStore } from "@/lib/store/calendar.store";
import { CalendarEvent, CATEGORY_CONFIG } from "@/lib/types/event.types";

const TODAY = new Date().toISOString().slice(0, 10);
const MONTH_FR = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const DAY_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const HOUR_HEIGHT = 48;
const START_HOUR = 7;
const END_HOUR = 22;

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getWeekDates(iso: string): string[] {
  const d = new Date(iso + "T12:00:00");
  const dow = d.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(d);
    dt.setDate(d.getDate() + i);
    return toISO(dt);
  });
}

function eventTopPx(startAt: string): number {
  const [h, m] = startAt.slice(11, 16).split(":").map(Number);
  return (h - START_HOUR + m / 60) * HOUR_HEIGHT;
}

function eventHeightPx(startAt: string, endAt: string): number {
  const [sh, sm] = startAt.slice(11, 16).split(":").map(Number);
  const [eh, em] = endAt.slice(11, 16).split(":").map(Number);
  return Math.max(((eh + em / 60) - (sh + sm / 60)) * HOUR_HEIGHT, 20);
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

export function WeekView() {
  const { events, displayedDate, activeView, navigate, goToToday, openModal, openEditModal, setView } = useCalendarStore();
  const weekDates = getWeekDates(displayedDate);
  const mondayDate = weekDates[0];
  const mondayMonth = parseInt(mondayDate.slice(5, 7));
  const mondayYear = parseInt(mondayDate.slice(0, 4));
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);
  const totalHeight = hours.length * HOUR_HEIGHT;

  const eventsByDate = new Map<string, CalendarEvent[]>();
  for (const ev of events) {
    const date = ev.startAt.slice(0, 10);
    if (!eventsByDate.has(date)) eventsByDate.set(date, []);
    eventsByDate.get(date)!.push(ev);
  }

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
            Semaine du {parseInt(mondayDate.slice(8))} {MONTH_FR[mondayMonth - 1]} {mondayYear}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ViewToggle activeView={activeView} setView={setView} />
          <button onClick={() => openModal()} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "#378ADD", color: "#fff", border: "none", borderRadius: "var(--border-radius-md)", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
            <i className="ti ti-plus" style={{ fontSize: 14 }} />
            Nouvel événement
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "48px repeat(7, minmax(0, 1fr))", borderBottom: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-primary)", flexShrink: 0 }}>
        <div />
        {weekDates.map((date, i) => {
          const isToday = date === TODAY;
          return (
            <div key={date} style={{ padding: "8px 0", textAlign: "center", borderLeft: "0.5px solid var(--color-border-tertiary)" }}>
              <div style={{ fontSize: 10, fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{DAY_SHORT[i]}</div>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", margin: "2px auto 0",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: isToday ? 500 : 400,
                background: isToday ? "#378ADD" : "transparent",
                color: isToday ? "#fff" : "var(--color-text-primary)",
              }}>
                {parseInt(date.slice(8))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div style={{ overflowY: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "48px repeat(7, minmax(0, 1fr))" }}>
          {/* Hour labels */}
          <div>
            {hours.map((h) => (
              <div key={h} style={{ height: HOUR_HEIGHT, display: "flex", alignItems: "flex-start", paddingTop: 2, paddingRight: 8, justifyContent: "flex-end" }}>
                <span style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>{h}h</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDates.map((date) => {
            const dayEvents = (eventsByDate.get(date) ?? []).filter((ev) => {
              const h = parseInt(ev.startAt.slice(11, 13));
              return h >= START_HOUR && h <= END_HOUR;
            });
            return (
              <div key={date} style={{ position: "relative", borderLeft: "0.5px solid var(--color-border-tertiary)", height: totalHeight }}>
                {hours.map((h) => (
                  <div key={h} style={{ position: "absolute", top: (h - START_HOUR) * HOUR_HEIGHT, left: 0, right: 0, height: "0.5px", background: "var(--color-border-tertiary)" }} />
                ))}
                {dayEvents.map((ev) => {
                  const cat = CATEGORY_CONFIG[ev.category];
                  return (
                    <div
                      key={ev.id}
                      onClick={(e) => { e.stopPropagation(); openEditModal(ev); }}
                      style={{ position: "absolute", left: 2, right: 2, top: eventTopPx(ev.startAt), height: eventHeightPx(ev.startAt, ev.endAt), background: cat.bg, borderLeft: `2px solid ${ev.color}`, borderRadius: 3, padding: "2px 4px", overflow: "hidden", cursor: "pointer" }}
                    >
                      <div style={{ fontSize: 10, fontWeight: 500, color: cat.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.title}</div>
                      <div style={{ fontSize: 9, color: cat.text, opacity: 0.8 }}>{ev.startAt.slice(11, 16)}</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
