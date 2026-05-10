"use client";

import { useMemo } from "react";
import { useHabitsStore, computeStreak, getWeekHistory } from "@/lib/store/habits.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { HabitRow } from "@/components/habits/HabitRow";
import { WeekStrip } from "@/components/habits/WeekStrip";
import { HabitModal } from "@/components/habits/HabitModal";
import {
  getWeekDates,
  formatISO,
  formatFrench,
  formatMonthYear,
  isSameDay,
} from "@/lib/utils/date";

const TODAY_ISO = new Date().toISOString().slice(0, 10);

export default function HabitsPage() {
  const { habits, completions, toggleCompletion, openModal } = useHabitsStore();
  const uid = useAuthStore((s) => s.user?.uid ?? "");

  const today = useMemo(() => new Date(TODAY_ISO + "T12:00:00Z"), []);
  const weekDates = useMemo(() => getWeekDates(today), [today]);

  // Completed today
  const completedToday = useMemo(
    () =>
      habits.filter((h) =>
        completions.some((c) => c.habitId === h.id && c.date === TODAY_ISO)
      ).length,
    [habits, completions]
  );
  const totalHabits = habits.length;

  // Best streak
  const streaks = useMemo(
    () =>
      habits.map((h) => ({
        id: h.id,
        name: h.name,
        streak: computeStreak(h.id, completions, TODAY_ISO),
      })),
    [habits, completions]
  );
  const bestStreak = streaks.reduce(
    (best, s) => (s.streak > best.streak ? s : best),
    { id: "", name: "—", streak: 0 }
  );

  // Week completion rate
  const weekRate = useMemo(() => {
    if (totalHabits === 0) return 0;
    const total = totalHabits * 7;
    const done = weekDates.reduce((acc, d) => {
      const iso = formatISO(d);
      return (
        acc + habits.filter((h) => completions.some((c) => c.habitId === h.id && c.date === iso)).length
      );
    }, 0);
    return Math.round((done / total) * 100);
  }, [habits, completions, weekDates, totalHabits]);

  // Month total
  const monthTotal = useMemo(() => {
    const prefix = TODAY_ISO.slice(0, 7);
    return completions.filter((c) => c.date.startsWith(prefix)).length;
  }, [completions]);

  // Day stats for week strip
  const dayStats = useMemo(
    () =>
      weekDates.map((d) => {
        const iso = formatISO(d);
        const completed = habits.filter((h) =>
          completions.some((c) => c.habitId === h.id && c.date === iso)
        ).length;
        return { date: d, completed, total: totalHabits };
      }),
    [weekDates, habits, completions, totalHabits]
  );

  // Week range label
  const weekRange = useMemo(() => {
    const start = weekDates[0];
    const end = weekDates[6];
    const months = ["jan", "fév", "mar", "avr", "mai", "juin", "juil", "août", "sep", "oct", "nov", "déc"];
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()} – ${end.getDate()} ${months[end.getMonth()]}`;
    }
    return `${start.getDate()} ${months[start.getMonth()]} – ${end.getDate()} ${months[end.getMonth()]}`;
  }, [weekDates]);

  // Progress
  const progress = totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0;

  const sortedHabits = habits.slice().sort((a, b) => a.order - b.order);

  return (
    <>
      <div
        style={{
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 18,
                fontWeight: 500,
                color: "var(--color-text-primary)",
              }}
            >
              Aujourd&apos;hui
            </h1>
            <p
              style={{
                fontSize: 12,
                color: "var(--color-text-secondary)",
                marginTop: 2,
              }}
            >
              {formatFrench(today)} · {completedToday} / {totalHabits} complétées
            </p>
          </div>
          <button
            onClick={openModal}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              background: "#7F77DD",
              color: "#fff",
              border: "none",
              borderRadius: "var(--border-radius-md)",
              fontSize: 13,
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            <i className="ti ti-plus" style={{ fontSize: 15 }} />
            Nouvelle habitude
          </button>
        </div>

        {/* Barre de progression */}
        <div
          style={{
            height: 3,
            background: "var(--color-border-tertiary)",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "#7F77DD",
              borderRadius: 2,
              transition: "width 0.3s ease",
            }}
          />
        </div>

        {/* Métriques */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 8,
          }}
        >
          <div
            style={{
              background: "var(--color-background-primary)",
              border: "0.5px solid var(--color-border-tertiary)",
              borderRadius: "var(--border-radius-md)",
              padding: "10px 12px",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "var(--color-text-secondary)",
                marginBottom: 3,
              }}
            >
              Complétées aujourd&apos;hui
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 500,
                color: "var(--color-text-primary)",
                lineHeight: 1.2,
              }}
            >
              {completedToday}
              <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                /{totalHabits}
              </span>
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--color-text-secondary)",
                marginTop: 2,
              }}
            >
              {totalHabits > 0 ? Math.round(progress) : 0}% du jour
            </div>
          </div>

          <div
            style={{
              background: "var(--color-background-primary)",
              border: "0.5px solid var(--color-border-tertiary)",
              borderRadius: "var(--border-radius-md)",
              padding: "10px 12px",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "var(--color-text-secondary)",
                marginBottom: 3,
              }}
            >
              Meilleur streak
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 500,
                color: "var(--color-text-primary)",
                lineHeight: 1.2,
              }}
            >
              {bestStreak.streak}
              <span style={{ fontSize: 13 }}> j</span>
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--color-text-secondary)",
                marginTop: 2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {bestStreak.name}
            </div>
          </div>

          <div
            style={{
              background: "var(--color-background-primary)",
              border: "0.5px solid var(--color-border-tertiary)",
              borderRadius: "var(--border-radius-md)",
              padding: "10px 12px",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "var(--color-text-secondary)",
                marginBottom: 3,
              }}
            >
              Taux cette semaine
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 500,
                color: "var(--color-text-primary)",
                lineHeight: 1.2,
              }}
            >
              {weekRate}
              <span style={{ fontSize: 13 }}>%</span>
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--color-text-secondary)",
                marginTop: 2,
              }}
            >
              vs semaine passée
            </div>
          </div>

          <div
            style={{
              background: "var(--color-background-primary)",
              border: "0.5px solid var(--color-border-tertiary)",
              borderRadius: "var(--border-radius-md)",
              padding: "10px 12px",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "var(--color-text-secondary)",
                marginBottom: 3,
              }}
            >
              Habitudes ce mois
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 500,
                color: "var(--color-text-primary)",
                lineHeight: 1.2,
              }}
            >
              {monthTotal}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--color-text-secondary)",
                marginTop: 2,
              }}
            >
              completions totales
            </div>
          </div>
        </div>

        {/* Bande semaine */}
        <WeekStrip
          weekDates={weekDates}
          dayStats={dayStats}
          today={today}
          weekRange={weekRange}
        />

        {/* Liste habitudes */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "var(--color-text-primary)",
              }}
            >
              Habitudes du jour
            </span>
            <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
              {totalHabits - completedToday} restante{totalHabits - completedToday !== 1 ? "s" : ""}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {sortedHabits.map((habit) => {
              const done = completions.some(
                (c) => c.habitId === habit.id && c.date === TODAY_ISO
              );
              const streak = computeStreak(habit.id, completions, TODAY_ISO);
              const history = getWeekHistory(habit.id, completions, weekDates);
              return (
                <HabitRow
                  key={habit.id}
                  habit={habit}
                  done={done}
                  streak={streak}
                  weekHistory={history}
                  onToggle={() => toggleCompletion(uid, habit.id, TODAY_ISO)}
                />
              );
            })}
            {sortedHabits.length === 0 && (
              <div style={{ textAlign: "center", padding: "28px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <i className="ti ti-plant" style={{ fontSize: 28, color: "var(--color-text-tertiary)" }} />
                <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>Ajoute ta première habitude</p>
                <button
                  onClick={openModal}
                  style={{ padding: "7px 14px", background: "#7F77DD", color: "#fff", border: "none", borderRadius: "var(--border-radius-md)", fontSize: 13, cursor: "pointer", fontWeight: 500 }}
                >
                  Créer une habitude
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      <HabitModal />
    </>
  );
}
