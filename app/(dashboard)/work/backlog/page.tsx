"use client";

import { useMemo } from "react";
import { useWorkStore } from "@/lib/store/work.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { TaskRow } from "@/components/work/TaskRow";
import { TaskModal } from "@/components/work/TaskModal";

const TODAY_ISO = new Date().toISOString().slice(0, 10);

export default function WorkBacklogPage() {
  const { tasks, toggleDone, updateTask, openModal, openEditModal } = useWorkStore();
  const uid = useAuthStore((s) => s.user?.uid ?? "");

  const backlogTasks = useMemo(
    () => tasks.filter((t) => t.dueDate === null).sort((a, b) => a.order - b.order),
    [tasks]
  );

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
            Backlog
          </h1>
          <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>
            {backlogTasks.length} tâche{backlogTasks.length !== 1 ? "s" : ""} sans date
          </p>
        </div>
        <button
          onClick={() => openModal()}
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

      {backlogTasks.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            color: "var(--color-text-tertiary)",
            fontSize: 13,
          }}
        >
          <i className="ti ti-inbox" style={{ fontSize: 24 }} />
          <span>Aucune tâche en backlog</span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {backlogTasks.map((task) => (
            <div key={task.id} style={{ display: "flex", alignItems: "stretch", gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <TaskRow task={task} onToggle={() => toggleDone(uid, task.id)} onEdit={() => openEditModal(task)} />
              </div>
              <button
                onClick={() => updateTask(uid, task.id, { dueDate: TODAY_ISO })}
                style={{
                  padding: "0 14px",
                  border: "0.5px solid var(--color-border-secondary)",
                  borderRadius: "var(--border-radius-md)",
                  background: "transparent",
                  fontSize: 12,
                  cursor: "pointer",
                  color: "var(--color-text-secondary)",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  transition: "background 0.1s, color 0.1s",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "#FAECE7";
                  (e.currentTarget as HTMLButtonElement).style.color = "#993C1D";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#D85A30";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-secondary)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border-secondary)";
                }}
                title="Planifier pour aujourd'hui"
              >
                <i className="ti ti-calendar-plus" style={{ fontSize: 13 }} />
                Planifier
              </button>
            </div>
          ))}
        </div>
      )}

      <TaskModal />
    </div>
  );
}
