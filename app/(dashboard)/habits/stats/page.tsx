"use client";

import { useMemo } from "react";
import { useHabitsStore, computeStreak } from "@/lib/store/habits.store";
import { getMonthDates, formatISO } from "@/lib/utils/date";
import { getColorInfo } from "@/lib/habitColors";

const _today = new Date();
const TODAY_ISO = _today.toISOString().slice(0, 10);
const YEAR = _today.getFullYear();
const MONTH = _today.getMonth() + 1;

// Intensity 0–4 → shade index
function getIntensity(rate: number): number {
  if (rate === 0) return 0;
  if (rate <= 0.25) return 1;
  if (rate <= 0.5) return 2;
  if (rate <= 0.75) return 3;
  return 4;
}

const HEAT_COLORS = [
  "var(--color-background-secondary)", // 0 – empty
  "#CECBF6", // 1 – violet 100
  "#AFA9EC", // 2 – violet 200
  "#7F77DD", // 3 – violet 400
  "#534AB7", // 4 – violet 600
];

export default function HabitsStatsPage() {
  const { habits, completions } = useHabitsStore();

  const monthDates = useMemo(() => getMonthDates(YEAR, MONTH), []);

  // First day of month to offset grid (1=Mon, …, 7=Sun in JS: 0=Sun)
  const firstDayOfWeek = useMemo(() => {
    const d = new Date(YEAR, MONTH - 1, 1);
    const day = d.getDay(); // 0=Sun
    return day === 0 ? 6 : day - 1; // convert to Mon=0
  }, []);

  // Heatmap data: for each date, completionRate = done/total
  const heatData = useMemo(() => {
    return monthDates.map((date) => {
      const iso = formatISO(date);
      const done = habits.filter((h) =>
        completions.some((c) => c.habitId === h.id && c.date === iso)
      ).length;
      const rate = habits.length > 0 ? done / habits.length : 0;
      return { date, iso, done, total: habits.length, rate };
    });
  }, [monthDates, habits, completions]);

  // Per-habit stats
  const habitStats = useMemo(() => {
    return habits
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((h) => {
        const streak = computeStreak(h.id, completions, TODAY_ISO);
        const monthDone = completions.filter(
          (c) => c.habitId === h.id && c.date.startsWith(`${YEAR}-${String(MONTH).padStart(2, "0")}`)
        ).length;
        const rate = monthDates.length > 0 ? monthDone / monthDates.length : 0;
        return { habit: h, streak, monthDone, rate };
      })
      .sort((a, b) => b.rate - a.rate);
  }, [habits, completions, monthDates]);

  const totalMonthCompletions = useMemo(
    () =>
      completions.filter((c) => c.date.startsWith(`${YEAR}-${String(MONTH).padStart(2, "0")}`)).length,
    [completions]
  );

  const DAY_NAMES = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  return (
    <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 500, color: "var(--color-text-primary)" }}>
          Statistiques
        </h1>
        <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>
          Mai 2026 · {totalMonthCompletions} completions au total
        </p>
      </div>

      {/* Heatmap */}
      <div
        style={{
          background: "var(--color-background-primary)",
          border: "0.5px solid var(--color-border-tertiary)",
          borderRadius: "var(--border-radius-md)",
          padding: "14px 16px",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "var(--color-text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: 12,
          }}
        >
          Completions ce mois
        </div>

        {/* Day headers */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 4,
            marginBottom: 4,
          }}
        >
          {DAY_NAMES.map((d) => (
            <div
              key={d}
              style={{
                fontSize: 10,
                color: "var(--color-text-secondary)",
                textAlign: "center",
              }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 4,
          }}
        >
          {/* Offset empty cells */}
          {Array.from({ length: firstDayOfWeek }, (_, i) => (
            <div key={`off-${i}`} style={{ height: 28 }} />
          ))}

          {heatData.map(({ date, iso, done, total, rate }) => {
            const intensity = getIntensity(rate);
            const isToday = iso === TODAY_ISO;
            const isFuture = iso > TODAY_ISO;
            return (
              <div
                key={iso}
                title={`${date.getDate()} mai — ${done}/${total}`}
                style={{
                  height: 28,
                  borderRadius: 4,
                  background: isFuture
                    ? "var(--color-background-secondary)"
                    : HEAT_COLORS[intensity],
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  color:
                    intensity >= 3 ? "#fff" : "var(--color-text-secondary)",
                  cursor: "default",
                  outline: isToday ? "1.5px solid #7F77DD" : "none",
                  outlineOffset: 1,
                }}
              >
                {date.getDate()}
              </div>
            );
          })}
        </div>

        {/* Légende */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginTop: 10,
            justifyContent: "flex-end",
          }}
        >
          <span style={{ fontSize: 10, color: "var(--color-text-secondary)" }}>Moins</span>
          {HEAT_COLORS.map((c, i) => (
            <div
              key={i}
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                background: c,
                border: "0.5px solid var(--color-border-tertiary)",
              }}
            />
          ))}
          <span style={{ fontSize: 10, color: "var(--color-text-secondary)" }}>Plus</span>
        </div>
      </div>

      {/* Classement par taux de completion */}
      <div
        style={{
          background: "var(--color-background-primary)",
          border: "0.5px solid var(--color-border-tertiary)",
          borderRadius: "var(--border-radius-md)",
          padding: "14px 16px",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "var(--color-text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: 12,
          }}
        >
          Progression par habitude
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {habitStats.map(({ habit, streak, monthDone, rate }, index) => {
            const col = getColorInfo(habit.color);
            const pct = Math.round(rate * 100);
            return (
              <div key={habit.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {/* Row header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}
                  >
                    {/* Rank */}
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--color-text-tertiary)",
                        fontVariantNumeric: "tabular-nums",
                        width: 16,
                        flexShrink: 0,
                      }}
                    >
                      {index + 1}
                    </span>
                    {/* Icon */}
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "var(--border-radius-md)",
                        background: col.pastel,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        color: col.iconColor,
                        flexShrink: 0,
                      }}
                    >
                      <i className={`ti ${habit.icon}`} />
                    </div>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "var(--color-text-primary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {habit.name}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    {/* Streak */}
                    {streak > 0 && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 3,
                          fontSize: 11,
                          fontWeight: 500,
                          padding: "2px 7px",
                          borderRadius: 20,
                          background: col.pastel,
                          color: col.textColor,
                        }}
                      >
                        <i
                          className="ti ti-flame"
                          style={{ fontSize: 10, color: habit.color }}
                        />
                        {streak}j
                      </div>
                    )}
                    {/* Days done */}
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--color-text-secondary)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {monthDone}j
                    </span>
                    {/* Percent */}
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: "var(--color-text-primary)",
                        fontVariantNumeric: "tabular-nums",
                        width: 36,
                        textAlign: "right",
                      }}
                    >
                      {pct}%
                    </span>
                  </div>
                </div>
                {/* Progress bar */}
                <div
                  style={{
                    height: 3,
                    background: "var(--color-border-tertiary)",
                    borderRadius: 2,
                    overflow: "hidden",
                    marginLeft: 24,
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: habit.color,
                      borderRadius: 2,
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Résumé mensuel */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 8,
        }}
      >
        {[
          {
            label: "Meilleur jour",
            value: heatData.reduce((best, d) => (d.done > best.done ? d : best), heatData[0])?.done ?? 0,
            sub: `/${habits.length} habitudes`,
          },
          {
            label: "Jours à 100%",
            value: heatData.filter((d) => d.total > 0 && d.done === d.total).length,
            sub: "jours parfaits",
          },
          {
            label: "Total completions",
            value: totalMonthCompletions,
            sub: "en mai 2026",
          },
        ].map((card) => (
          <div
            key={card.label}
            style={{
              background: "var(--color-background-primary)",
              border: "0.5px solid var(--color-border-tertiary)",
              borderRadius: "var(--border-radius-md)",
              padding: "10px 12px",
            }}
          >
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 3 }}>
              {card.label}
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 500,
                color: "var(--color-text-primary)",
                lineHeight: 1.2,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {card.value}
            </div>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>
              {card.sub}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
