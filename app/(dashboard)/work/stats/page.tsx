"use client";

import { useMemo } from "react";
import { useWorkStore } from "@/lib/store/work.store";
import { type Task } from "@/lib/types/task.types";

const TODAY_ISO = new Date().toISOString().slice(0, 10);

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
}

const DAY_SHORT = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function isoToShortDay(iso: string) {
  return DAY_SHORT[new Date(iso + "T12:00:00").getDay()];
}

export default function WorkStatsPage() {
  const { tasks } = useWorkStore();

  const last7 = getLast7Days();

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === "done").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const todo = tasks.filter((t) => t.status === "todo").length;
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

    const high = tasks.filter((t) => t.priority === "high").length;
    const medium = tasks.filter((t) => t.priority === "medium").length;
    const low = tasks.filter((t) => t.priority === "low").length;

    const overdue = tasks.filter(
      (t) => t.dueDate && t.dueDate < TODAY_ISO && t.status !== "done"
    ).length;

    const todayTasks = tasks.filter((t) => t.dueDate === TODAY_ISO);
    const todayDone = todayTasks.filter((t) => t.status === "done").length;

    const dailyCounts = last7.map((iso) => ({
      iso,
      label: isoToShortDay(iso),
      isToday: iso === TODAY_ISO,
      created: tasks.filter((t) => t.createdAt?.slice(0, 10) === iso).length,
      completed: tasks.filter((t) => t.status === "done" && t.dueDate === iso).length,
    }));

    return { total, done, inProgress, todo, completionRate, high, medium, low, overdue, todayTasks, todayDone, dailyCounts };
  }, [tasks]);

  const maxDaily = Math.max(...stats.dailyCounts.map((d) => Math.max(d.created, d.completed)), 1);
  const BAR_MAX = 60;

  const CARD: React.CSSProperties = {
    background: "var(--color-background-primary)",
    border: "0.5px solid var(--color-border-tertiary)",
    borderRadius: "var(--border-radius-md)",
    padding: "12px 14px",
  };

  return (
    <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 500, color: "var(--color-text-primary)" }}>Statistiques</h1>
        <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>
          Vue d&apos;ensemble de toutes vos tâches
        </p>
      </div>

      {/* 4 metric cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8 }}>
        <div style={CARD}>
          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 3 }}>Total tâches</div>
          <div style={{ fontSize: 28, fontWeight: 500, color: "var(--color-text-primary)", lineHeight: 1.2 }}>{stats.total}</div>
          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>créées</div>
        </div>
        <div style={CARD}>
          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 3 }}>Terminées</div>
          <div style={{ fontSize: 28, fontWeight: 500, color: "#1D9E75", lineHeight: 1.2 }}>{stats.done}</div>
          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>{stats.completionRate}% du total</div>
        </div>
        <div style={CARD}>
          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 3 }}>En cours</div>
          <div style={{ fontSize: 28, fontWeight: 500, color: "#378ADD", lineHeight: 1.2 }}>{stats.inProgress}</div>
          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>en progression</div>
        </div>
        <div style={CARD}>
          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 3 }}>En retard</div>
          <div style={{ fontSize: 28, fontWeight: 500, color: stats.overdue > 0 ? "#E24B4A" : "var(--color-text-primary)", lineHeight: 1.2 }}>{stats.overdue}</div>
          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>date dépassée</div>
        </div>
      </div>

      {/* Progress bar global */}
      <div style={CARD}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>Taux de complétion global</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: "#1D9E75" }}>{stats.completionRate}%</span>
        </div>
        <div style={{ height: 8, background: "var(--color-background-secondary)", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${stats.completionRate}%`, background: "#1D9E75", borderRadius: 4, transition: "width 0.4s ease" }} />
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
          {[
            { label: "À faire", count: stats.todo, color: "var(--color-text-secondary)" },
            { label: "En cours", count: stats.inProgress, color: "#378ADD" },
            { label: "Terminées", count: stats.done, color: "#1D9E75" },
          ].map((s) => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{s.label} : <strong style={{ color: "var(--color-text-primary)" }}>{s.count}</strong></span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {/* Priorités */}
        <div style={CARD}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 12 }}>Par priorité</div>
          {[
            { label: "Haute", count: stats.high, color: "#E24B4A", total: stats.total },
            { label: "Moyenne", count: stats.medium, color: "#EF9F27", total: stats.total },
            { label: "Basse", count: stats.low, color: "#639922", total: stats.total },
          ].map((p) => (
            <div key={p.label} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{p.label}</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-primary)" }}>{p.count}</span>
              </div>
              <div style={{ height: 5, background: "var(--color-background-secondary)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: p.total > 0 ? `${Math.round((p.count / p.total) * 100)}%` : "0%", background: p.color, borderRadius: 3, transition: "width 0.4s ease" }} />
              </div>
            </div>
          ))}
        </div>

        {/* Aujourd'hui */}
        <div style={CARD}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 12 }}>Aujourd&apos;hui</div>
          <div style={{ fontSize: 32, fontWeight: 500, color: "var(--color-text-primary)", lineHeight: 1 }}>
            {stats.todayDone}
            <span style={{ fontSize: 18, color: "var(--color-text-secondary)", fontWeight: 400 }}> / {stats.todayTasks.length}</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 6, marginBottom: 12 }}>tâches terminées ce jour</div>
          {stats.todayTasks.length > 0 && (
            <div style={{ height: 6, background: "var(--color-background-secondary)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${stats.todayTasks.length > 0 ? Math.round((stats.todayDone / stats.todayTasks.length) * 100) : 0}%`, background: "#1D9E75", borderRadius: 3 }} />
            </div>
          )}
          {stats.todayTasks.length === 0 && (
            <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", fontStyle: "italic" }}>Aucune tâche prévue</div>
          )}
        </div>
      </div>

      {/* Bar chart 7 derniers jours */}
      <div style={CARD}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>7 derniers jours</span>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: "#D85A30", display: "inline-block" }} />
              <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>Créées</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: "#1D9E75", display: "inline-block" }} />
              <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>Terminées</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: BAR_MAX + 28 }}>
          {stats.dailyCounts.map((day) => {
            const createdH = day.created > 0 ? Math.max((day.created / maxDaily) * BAR_MAX, 4) : 0;
            const completedH = day.completed > 0 ? Math.max((day.completed / maxDaily) * BAR_MAX, 4) : 0;
            return (
              <div key={day.iso} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <div style={{ display: "flex", alignItems: "flex-end", height: BAR_MAX, gap: 2, width: "100%" }}>
                  <div style={{ flex: 1, height: createdH, borderRadius: "3px 3px 0 0", background: day.isToday ? "#D85A30" : day.created > 0 ? "#D85A3066" : "transparent", minHeight: day.created > 0 ? 2 : 0 }} />
                  <div style={{ flex: 1, height: completedH, borderRadius: "3px 3px 0 0", background: day.isToday ? "#1D9E75" : day.completed > 0 ? "#1D9E7566" : "transparent", minHeight: day.completed > 0 ? 2 : 0 }} />
                </div>
                <span style={{ fontSize: 9, color: day.isToday ? "var(--color-text-primary)" : "var(--color-text-secondary)", fontWeight: day.isToday ? 500 : 400 }}>
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {stats.total === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0", fontSize: 13, color: "var(--color-text-tertiary)" }}>
          Aucune tâche pour le moment — crée-en une !
        </div>
      )}
    </div>
  );
}
