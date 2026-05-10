"use client";

import { useMemo } from "react";
import { useWorkStore } from "@/lib/store/work.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { TaskRow } from "@/components/work/TaskRow";
import { TaskModal } from "@/components/work/TaskModal";

const TODAY_ISO = new Date().toISOString().slice(0, 10);

const FULL_DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const MONTHS    = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

function getWeekISOs(iso: string): string[] {
  const d = new Date(iso + "T12:00:00Z");
  const day = d.getUTCDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setUTCDate(d.getUTCDate() + diffToMon);
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(mon);
    dd.setUTCDate(mon.getUTCDate() + i);
    return dd.toISOString().slice(0, 10);
  });
}

function formatDayHeader(iso: string): string {
  const d = new Date(iso + "T12:00:00Z");
  return `${FULL_DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

export default function WorkWeekPage() {
  const { tasks, toggleDone, openModal, openEditModal } = useWorkStore();
  const uid = useAuthStore((s) => s.user?.uid ?? "");

  const weekISOs = useMemo(() => getWeekISOs(TODAY_ISO), []);

  const weekGroups = useMemo(
    () =>
      weekISOs.map((iso) => ({
        iso,
        label: formatDayHeader(iso),
        isToday: iso === TODAY_ISO,
        tasks: tasks.filter((t) => t.dueDate === iso).sort((a, b) => a.order - b.order),
      })),
    [tasks, weekISOs]
  );

  const totalTasks = weekGroups.reduce((sum, g) => sum + g.tasks.length, 0);
  const doneTasks  = weekGroups.reduce((sum, g) => sum + g.tasks.filter((t) => t.status === "done").length, 0);

  const weekEnd = new Date(weekISOs[6] + "T12:00:00Z");
  const MONTHS_FR = ["jan","fév","mar","avr","mai","juin","juil","août","sep","oct","nov","déc"];
  const weekRange = `${new Date(weekISOs[0] + "T12:00:00Z").getUTCDate()} – ${weekEnd.getUTCDate()} ${MONTHS_FR[weekEnd.getUTCMonth()]}`;

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        padding: 20,
        overflowY: "auto",
        background: "var(--color-background-tertiary)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: "var(--color-text-primary)" }}>
            Cette semaine
          </h1>
          <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>
            {weekRange} · {doneTasks}/{totalTasks} terminées
          </p>
        </div>
        <button
          onClick={() => openModal(TODAY_ISO)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            background: "#D85A30",
            color: "#fff",
            border: "none",
            borderRadius: "var(--border-radius-md)",
            fontSize: 13,
            cursor: "pointer",
            fontWeight: 500,
            flexShrink: 0,
          }}
        >
          <i className="ti ti-plus" style={{ fontSize: 14 }} />
          Nouvelle tâche
        </button>
      </div>

      {/* Grouped days */}
      {weekGroups.map(({ iso, label, isToday, tasks: dayTasks }) => {
        if (dayTasks.length === 0) return null;
        const dayDone = dayTasks.filter((t) => t.status === "done").length;
        return (
          <div key={iso}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: isToday ? "#D85A30" : "var(--color-text-secondary)",
                }}
              >
                {label}
              </span>
              {isToday && (
                <span
                  style={{
                    fontSize: 10,
                    padding: "1px 7px",
                    borderRadius: 20,
                    background: "#FAECE7",
                    color: "#993C1D",
                    fontWeight: 500,
                  }}
                >
                  Aujourd&apos;hui
                </span>
              )}
              <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
                {dayDone}/{dayTasks.length}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {dayTasks.map((task) => (
                <TaskRow key={task.id} task={task} onToggle={() => toggleDone(uid, task.id)} onEdit={() => openEditModal(task)} />
              ))}
            </div>
          </div>
        );
      })}

      {totalTasks === 0 && (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-text-tertiary)",
            fontSize: 13,
          }}
        >
          Aucune tâche cette semaine
        </div>
      )}

      <TaskModal />
    </div>
  );
}
