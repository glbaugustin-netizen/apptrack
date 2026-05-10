"use client";

import { useState, useEffect } from "react";
import { TaskPriority, TaskStatus } from "@/lib/types/task.types";
import { useWorkStore } from "@/lib/store/work.store";
import { useAuthStore } from "@/lib/store/auth.store";

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
  { value: "high",   label: "Haute",   color: "#E24B4A" },
  { value: "medium", label: "Moyenne", color: "#EF9F27" },
  { value: "low",    label: "Basse",   color: "#639922" },
];

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "todo",        label: "À faire"  },
  { value: "in_progress", label: "En cours" },
  { value: "done",        label: "Terminée" },
];

export function TaskModal() {
  const { isModalOpen, closeModal, addTask, updateTask, deleteTask, modalInitialDate, editingTask } = useWorkStore();
  const uid = useAuthStore((s) => s.user?.uid ?? "");

  const [title, setTitle]       = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [status, setStatus]     = useState<TaskStatus>("todo");
  const [dueDate, setDueDate]   = useState<string>("");

  useEffect(() => {
    if (isModalOpen) {
      if (editingTask) {
        setTitle(editingTask.title);
        setPriority(editingTask.priority);
        setStatus(editingTask.status);
        setDueDate(editingTask.dueDate ?? "");
      } else {
        setTitle("");
        setPriority("medium");
        setStatus("todo");
        setDueDate(modalInitialDate ?? "");
      }
    }
  }, [isModalOpen, editingTask, modalInitialDate]);

  function handleSubmit() {
    if (!title.trim()) return;
    if (editingTask) {
      updateTask(uid, editingTask.id, { title: title.trim(), priority, status, dueDate: dueDate || null });
    } else {
      addTask(uid, { title: title.trim(), priority, status, dueDate: dueDate || null });
    }
    closeModal();
  }

  if (!isModalOpen) return null;

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.32)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }}
      onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
    >
      <div
        style={{ background: "var(--color-background-primary)", borderRadius: "var(--border-radius-xl)", border: "0.5px solid var(--color-border-tertiary)", width: "100%", maxWidth: 400, overflow: "hidden" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <span style={{ fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)" }}>
            {editingTask ? "Modifier la tâche" : "Nouvelle tâche"}
          </span>
          <button onClick={closeModal} style={{ width: 24, height: 24, borderRadius: "var(--border-radius-md)", border: "none", background: "transparent", cursor: "pointer", color: "var(--color-text-secondary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, padding: 0 }}>
            <i className="ti ti-x" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 5 }}>Titre</label>
            <input
              type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Nom de la tâche..." autoFocus
              style={{ width: "100%", padding: "8px 10px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", fontSize: 14, background: "var(--color-background-primary)", color: "var(--color-text-primary)", outline: "none" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#D85A30"; e.currentTarget.style.boxShadow = "0 0 0 2px #D85A3033"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border-secondary)"; e.currentTarget.style.boxShadow = "none"; }}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); if (e.key === "Escape") closeModal(); }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 5 }}>Priorité</label>
            <div style={{ display: "flex", gap: 6 }}>
              {PRIORITY_OPTIONS.map((opt) => {
                const sel = opt.value === priority;
                return (
                  <button key={opt.value} onClick={() => setPriority(opt.value)} style={{ padding: "5px 12px", border: sel ? `1px solid ${opt.color}` : "0.5px solid var(--color-border-tertiary)", borderRadius: 20, fontSize: 12, cursor: "pointer", background: sel ? `${opt.color}22` : "transparent", color: sel ? opt.color : "var(--color-text-secondary)", fontWeight: sel ? 500 : 400 }}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 5 }}>Statut</label>
            <div style={{ display: "flex", gap: 6 }}>
              {STATUS_OPTIONS.map((opt) => {
                const sel = opt.value === status;
                return (
                  <button key={opt.value} onClick={() => setStatus(opt.value)} style={{ padding: "5px 12px", border: sel ? "1px solid #D85A30" : "0.5px solid var(--color-border-tertiary)", borderRadius: 20, fontSize: 12, cursor: "pointer", background: sel ? "#FAECE7" : "transparent", color: sel ? "#993C1D" : "var(--color-text-secondary)", fontWeight: sel ? 500 : 400 }}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 5 }}>Date (vide = backlog)</label>
            <input
              type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              style={{ width: "100%", padding: "8px 10px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", fontSize: 13, background: "var(--color-background-primary)", color: "var(--color-text-primary)", outline: "none" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#D85A30"; e.currentTarget.style.boxShadow = "0 0 0 2px #D85A3033"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border-secondary)"; e.currentTarget.style.boxShadow = "none"; }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "12px 16px", borderTop: "0.5px solid var(--color-border-tertiary)" }}>
          <div>
            {editingTask && (
              <button
                onClick={() => { deleteTask(uid, editingTask.id); closeModal(); }}
                style={{ padding: "6px 14px", border: "0.5px solid #E24B4A", borderRadius: "var(--border-radius-md)", background: "transparent", fontSize: 13, cursor: "pointer", color: "var(--color-text-danger)" }}
              >
                Supprimer
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={closeModal} style={{ padding: "6px 14px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "transparent", fontSize: 13, cursor: "pointer", color: "var(--color-text-secondary)" }}>
              Annuler
            </button>
            <button
              onClick={handleSubmit} disabled={!title.trim()}
              style={{ padding: "6px 14px", background: title.trim() ? "#D85A30" : "var(--color-border-tertiary)", color: title.trim() ? "#fff" : "var(--color-text-tertiary)", border: "none", borderRadius: "var(--border-radius-md)", fontSize: 13, cursor: title.trim() ? "pointer" : "not-allowed", fontWeight: 500 }}
            >
              {editingTask ? "Enregistrer" : "Créer la tâche"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
