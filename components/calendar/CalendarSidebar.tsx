"use client";

import { useCalendarStore } from "@/lib/store/calendar.store";
import { CATEGORY_CONFIG } from "@/lib/types/event.types";

const TODAY = new Date().toISOString().slice(0, 10);
const MONTH_FR = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getMiniCalDays(year: number, month: number): { date: string; inMonth: boolean }[] {
  const firstDay = new Date(year, month - 1, 1);
  const dow = firstDay.getDay(); // 0=Sun
  const leading = dow === 0 ? 6 : dow - 1; // Mon-first
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

export function CalendarSidebar() {
  const { events, displayedDate, activeView, navigateMonth, openModal, setView } = useCalendarStore();
  const [year, month] = displayedDate.split("-").map(Number);
  const cells = getMiniCalDays(year, month);
  const eventDays = new Set(events.map((e) => e.startAt.slice(0, 10)));

  return (
    <>
      {/* View nav */}
      <div style={{ padding: "14px 14px 8px", fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Vues
      </div>
      {(
        [
          ["month", "ti-calendar-month", "Mois"],
          ["week", "ti-calendar-week", "Semaine"],
          ["day", "ti-calendar-event", "Jour"],
        ] as const
      ).map(([view, icon, label]) => {
        const active = activeView === view;
        return (
          <button
            key={view}
            onClick={() => setView(view)}
            style={{
              display: "flex", alignItems: "center", gap: 9,
              padding: "8px 14px", width: "100%", textAlign: "left",
              border: "none", cursor: "pointer", fontSize: 13,
              background: active ? "var(--color-background-secondary)" : "transparent",
              color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              fontWeight: active ? 500 : 400,
              transition: "background 0.1s",
            }}
            onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "var(--color-background-secondary)"; e.currentTarget.style.color = "var(--color-text-primary)"; } }}
            onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-text-secondary)"; } }}
          >
            <i className={`ti ${icon}`} style={{ fontSize: 16 }} />
            {label}
          </button>
        );
      })}

      {/* Divider */}
      <div style={{ height: "0.5px", background: "var(--color-border-tertiary)", margin: "8px 0" }} />

      {/* Mini calendar */}
      <div style={{ padding: "10px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-primary)" }}>
            {MONTH_FR[month - 1]} {year}
          </span>
          <div style={{ display: "flex", gap: 2 }}>
            <button
              onClick={() => navigateMonth("prev")}
              style={{ width: 20, height: 20, border: "none", background: "transparent", cursor: "pointer", color: "var(--color-text-secondary)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, fontSize: 12 }}
            >
              <i className="ti ti-chevron-left" />
            </button>
            <button
              onClick={() => navigateMonth("next")}
              style={{ width: 20, height: 20, border: "none", background: "transparent", cursor: "pointer", color: "var(--color-text-secondary)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, fontSize: 12 }}
            >
              <i className="ti ti-chevron-right" />
            </button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1 }}>
          {DAY_LABELS.map((d, i) => (
            <div key={i} style={{ fontSize: 9, color: "var(--color-text-tertiary)", textAlign: "center", padding: "2px 0", fontWeight: 500 }}>
              {d}
            </div>
          ))}
          {cells.map((cell, i) => {
            const isToday = cell.date === TODAY;
            const hasEvent = eventDays.has(cell.date);
            return (
              <div
                key={i}
                onClick={() => openModal(cell.date)}
                style={{
                  position: "relative",
                  fontSize: 10, textAlign: "center",
                  cursor: "pointer",
                  color: isToday ? "#fff" : cell.inMonth ? "var(--color-text-secondary)" : "var(--color-text-tertiary)",
                  background: isToday ? "#378ADD" : "transparent",
                  width: 22, height: 22, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto", fontWeight: isToday ? 500 : 400,
                }}
              >
                {parseInt(cell.date.slice(8))}
                {hasEvent && (
                  <span style={{
                    position: "absolute", bottom: 1, left: "50%", transform: "translateX(-50%)",
                    width: 3, height: 3, borderRadius: "50%",
                    background: isToday ? "#fff" : "#378ADD",
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: "0.5px", background: "var(--color-border-tertiary)", margin: "8px 0" }} />

      {/* Categories */}
      <div style={{ padding: "8px 14px 4px", fontSize: 11, color: "var(--color-text-secondary)" }}>
        Catégories
      </div>
      {Object.entries(CATEGORY_CONFIG).map(([key, cat]) => (
        <div key={key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: cat.color, flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{cat.label}</span>
        </div>
      ))}

      {/* CTA */}
      <div style={{ marginTop: "auto", padding: "12px 14px" }}>
        <button
          onClick={() => openModal()}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            width: "100%", padding: "7px 10px",
            background: "#378ADD", color: "#fff",
            border: "none", borderRadius: "var(--border-radius-md)",
            fontSize: 13, cursor: "pointer", fontWeight: 500,
          }}
        >
          <i className="ti ti-plus" style={{ fontSize: 14 }} />
          Nouvel événement
        </button>
      </div>
    </>
  );
}
