"use client";

import { useCalendarStore } from "@/lib/store/calendar.store";
import { CalendarEvent, CATEGORY_CONFIG } from "@/lib/types/event.types";

const TODAY = new Date().toISOString().slice(0, 10);
const MONTH_FR = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getMonthGrid(year: number, month: number): { date: string; inMonth: boolean }[] {
  const firstDay = new Date(year, month - 1, 1);
  const dow = firstDay.getDay();
  const leading = dow === 0 ? 6 : dow - 1;
  const cells: { date: string; inMonth: boolean }[] = [];

  for (let i = leading - 1; i >= 0; i--) {
    cells.push({ date: toISO(new Date(year, month - 1, -i)), inMonth: false });
  }
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`, inMonth: true });
  }
  const remaining = (7 - (cells.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ date: toISO(new Date(year, month, d)), inMonth: false });
  }
  return cells;
}

function formatHour(startAt: string): string {
  return `${parseInt(startAt.slice(11, 13))}h`;
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

export function MonthGrid() {
  const { events, displayedDate, activeView, navigate, goToToday, openModal, openEditModal, setView } = useCalendarStore();
  const [year, month] = displayedDate.split("-").map(Number);
  const cells = getMonthGrid(year, month);
  const rows = cells.length / 7;

  const eventsByDate = new Map<string, CalendarEvent[]>();
  for (const ev of events) {
    const date = ev.startAt.slice(0, 10);
    if (!eventsByDate.has(date)) eventsByDate.set(date, []);
    eventsByDate.get(date)!.push(ev);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 20px 12px",
        borderBottom: "0.5px solid var(--color-border-tertiary)",
        background: "var(--color-background-primary)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => navigate("prev")}
            style={{ width: 28, height: 28, border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-md)", background: "transparent", cursor: "pointer", color: "var(--color-text-secondary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}
          >
            <i className="ti ti-chevron-left" />
          </button>
          <button
            onClick={() => navigate("next")}
            style={{ width: 28, height: 28, border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-md)", background: "transparent", cursor: "pointer", color: "var(--color-text-secondary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}
          >
            <i className="ti ti-chevron-right" />
          </button>
          <button
            onClick={goToToday}
            style={{ padding: "4px 10px", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-md)", background: "transparent", cursor: "pointer", color: "var(--color-text-secondary)", fontSize: 12 }}
          >
            Aujourd&apos;hui
          </button>
          <span style={{ fontSize: 16, fontWeight: 500, color: "var(--color-text-primary)" }}>
            {MONTH_FR[month - 1]} {year}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ViewToggle activeView={activeView} setView={setView} />
          <button
            onClick={() => openModal()}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "#378ADD", color: "#fff", border: "none", borderRadius: "var(--border-radius-md)", fontSize: 13, cursor: "pointer", fontWeight: 500 }}
          >
            <i className="ti ti-plus" style={{ fontSize: 14 }} />
            Nouvel événement
          </button>
        </div>
      </div>

      {/* Day name header */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", borderBottom: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-primary)" }}>
        {DAY_LABELS.map((d) => (
          <div key={d} style={{ padding: "7px 0", textAlign: "center", fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gridTemplateRows: `repeat(${rows}, minmax(90px, 1fr))` }}>
        {cells.map((cell, idx) => {
          const isToday = cell.date === TODAY;
          const dayEvents = eventsByDate.get(cell.date) ?? [];
          const overflow = dayEvents.length - 2;
          return (
            <div
              key={idx}
              onClick={() => openModal(cell.date)}
              style={{
                borderRight: idx % 7 !== 6 ? "0.5px solid var(--color-border-tertiary)" : "none",
                borderBottom: idx < cells.length - 7 ? "0.5px solid var(--color-border-tertiary)" : "none",
                padding: "5px 6px",
                cursor: "pointer",
                background: isToday ? "var(--color-calendar-today-bg)" : cell.inMonth ? "var(--color-background-primary)" : "var(--color-background-tertiary)",
                display: "flex", flexDirection: "column", gap: 3,
                transition: "background 0.1s",
              }}
            >
              <span style={{
                width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                fontSize: 12, fontWeight: 500,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: isToday ? "#378ADD" : "transparent",
                color: isToday ? "#fff" : cell.inMonth ? "var(--color-text-secondary)" : "var(--color-text-tertiary)",
              }}>
                {parseInt(cell.date.slice(8))}
              </span>
              {dayEvents.slice(0, 2).map((ev) => {
                const cat = CATEGORY_CONFIG[ev.category];
                return (
                  <div
                    key={ev.id}
                    onClick={(e) => { e.stopPropagation(); openEditModal(ev); }}
                    style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 5px", borderRadius: 3, background: cat.bg, overflow: "hidden", whiteSpace: "nowrap", cursor: "pointer" }}
                  >
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: ev.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 9, color: cat.text, flexShrink: 0 }}>{formatHour(ev.startAt)}</span>
                    <span style={{ fontSize: 10, color: cat.text, overflow: "hidden", textOverflow: "ellipsis" }}>{ev.title}</span>
                    <i className="ti ti-pencil" style={{ fontSize: 9, color: cat.text, marginLeft: "auto", flexShrink: 0, opacity: 0.6 }} />
                  </div>
                );
              })}
              {overflow > 0 && (
                <span style={{ fontSize: 10, color: "var(--color-text-secondary)", padding: "1px 5px" }}>+{overflow}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
