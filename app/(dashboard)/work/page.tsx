"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { useWorkStore } from "@/lib/store/work.store";
import { useAuthStore } from "@/lib/store/auth.store";
import { type Task, type TaskStatus } from "@/lib/types/task.types";
import { TaskRow } from "@/components/work/TaskRow";
import { TaskModal } from "@/components/work/TaskModal";

const TODAY_ISO = new Date().toISOString().slice(0, 10);

const FULL_DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const MONTHS    = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const DAY_ABBR  = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function formatTodayLabel(iso: string): string {
  const d = new Date(iso + "T12:00:00Z");
  return `${FULL_DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

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

const PRIORITY_PILL_COLORS: Record<Task["priority"], { bg: string; border: string }> = {
  high:   { bg: "#FCEBEB", border: "#E24B4A" },
  medium: { bg: "#FAEEDA", border: "#EF9F27" },
  low:    { bg: "#EAF3DE", border: "#639922" },
};

type FilterValue = "all" | TaskStatus;

const FILTER_OPTIONS: { value: FilterValue; label: string }[] = [
  { value: "all",         label: "Toutes"    },
  { value: "todo",        label: "À faire"   },
  { value: "in_progress", label: "En cours"  },
  { value: "done",        label: "Terminées" },
];

function SortableTaskRow({ task, onToggle, onEdit }: { task: Task; onToggle: () => void; onEdit: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, position: "relative", zIndex: isDragging ? 10 : "auto" }}
    >
      <TaskRow
        task={task}
        onToggle={onToggle}
        onEdit={onEdit}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dragHandleListeners={listeners as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dragHandleAttributes={attributes as any}
      />
    </div>
  );
}

export default function WorkPage() {
  const { tasks, openModal, openEditModal, toggleDone, reorderTasks } = useWorkStore();
  const uid = useAuthStore((s) => s.user?.uid ?? "");
  const [filter, setFilter] = useState<FilterValue>("all");

  const weekISOs = useMemo(() => getWeekISOs(TODAY_ISO), []);

  const todayTasks = useMemo(
    () => tasks.filter((t) => t.dueDate === TODAY_ISO).sort((a, b) => a.order - b.order),
    [tasks]
  );

  const filteredTasks = useMemo(
    () => filter === "all" ? todayTasks : todayTasks.filter((t) => t.status === filter),
    [todayTasks, filter]
  );

  const doneTasks       = useMemo(() => todayTasks.filter((t) => t.status === "done"), [todayTasks]);
  const inProgressCount = useMemo(() => todayTasks.filter((t) => t.status === "in_progress").length, [todayTasks]);
  const highPrioCount   = useMemo(() => todayTasks.filter((t) => t.priority === "high" && t.status !== "done").length, [todayTasks]);
  const weekTotal       = useMemo(() => tasks.filter((t) => t.dueDate && weekISOs.includes(t.dueDate)).length, [tasks, weekISOs]);

  const progressPct = todayTasks.length > 0 ? Math.round((doneTasks.length / todayTasks.length) * 100) : 0;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = todayTasks.findIndex((t) => t.id === active.id);
    const newIdx = todayTasks.findIndex((t) => t.id === over.id);
    const reordered = arrayMove(todayTasks, oldIdx, newIdx).map((t, i) => ({ ...t, order: i }));
    const others = tasks.filter((t) => t.dueDate !== TODAY_ISO);
    reorderTasks([...others, ...reordered]);
  }

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
            Aujourd&apos;hui
          </h1>
          <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>
            {formatTodayLabel(TODAY_ISO)} · {doneTasks.length}/{todayTasks.length} terminées
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

      {/* Progress bar */}
      <div style={{ height: 3, background: "var(--color-border-tertiary)", borderRadius: 2, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            background: "#D85A30",
            borderRadius: 2,
            width: `${progressPct}%`,
            transition: "width 0.3s ease",
          }}
        />
      </div>

      {/* Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8 }}>
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-md)", padding: "10px 12px" }}>
          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 3 }}>Terminées</div>
          <div style={{ fontSize: 20, fontWeight: 500, color: "var(--color-text-primary)", lineHeight: 1.2 }}>
            {doneTasks.length} <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>/ {todayTasks.length}</span>
          </div>
          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>{progressPct}% du jour</div>
        </div>
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-md)", padding: "10px 12px" }}>
          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 3 }}>En cours</div>
          <div style={{ fontSize: 20, fontWeight: 500, color: "var(--color-text-primary)", lineHeight: 1.2 }}>{inProgressCount}</div>
          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>tâches actives</div>
        </div>
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-md)", padding: "10px 12px" }}>
          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 3 }}>Haute priorité</div>
          <div style={{ fontSize: 20, fontWeight: 500, color: "var(--color-text-danger)", lineHeight: 1.2 }}>{highPrioCount}</div>
          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>à traiter</div>
        </div>
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-md)", padding: "10px 12px" }}>
          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 3 }}>Cette semaine</div>
          <div style={{ fontSize: 20, fontWeight: 500, color: "var(--color-text-primary)", lineHeight: 1.2 }}>{weekTotal}</div>
          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>tâches planifiées</div>
        </div>
      </div>

      {/* Task list */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>
            Tâches du jour
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            {FILTER_OPTIONS.map((opt) => {
              const active = opt.value === filter;
              return (
                <button
                  key={opt.value}
                  onClick={() => setFilter(opt.value)}
                  style={{
                    padding: "4px 10px",
                    border: active ? "0.5px solid #D85A30" : "0.5px solid var(--color-border-tertiary)",
                    borderRadius: 20,
                    fontSize: 11,
                    cursor: "pointer",
                    background: active ? "#FAECE7" : "transparent",
                    color: active ? "#993C1D" : "var(--color-text-secondary)",
                    fontWeight: active ? 500 : 400,
                    transition: "all 0.1s",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={todayTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {filteredTasks.map((task) => (
                <SortableTaskRow key={task.id} task={task} onToggle={() => toggleDone(uid, task.id)} onEdit={() => openEditModal(task)} />
              ))}
              {filteredTasks.length === 0 && (
                <div style={{ textAlign: "center", padding: "28px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <i className="ti ti-checkbox" style={{ fontSize: 28, color: "var(--color-text-tertiary)" }} />
                  <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>
                    {todayTasks.length === 0 ? "Aucune tâche planifiée aujourd'hui" : "Aucune tâche dans ce filtre"}
                  </p>
                  {todayTasks.length === 0 && (
                    <button
                      onClick={() => openModal(TODAY_ISO)}
                      style={{ padding: "7px 14px", background: "#D85A30", color: "#fff", border: "none", borderRadius: "var(--border-radius-md)", fontSize: 13, cursor: "pointer", fontWeight: 500 }}
                    >
                      Ajouter une tâche
                    </button>
                  )}
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Week grid */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>Vue semaine</span>
          <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
            {new Date(weekISOs[0] + "T12:00:00Z").getUTCDate()} –{" "}
            {new Date(weekISOs[6] + "T12:00:00Z").getUTCDate()} {["jan","fév","mar","avr","mai","juin","juil","août","sep","oct","nov","déc"][new Date(weekISOs[6] + "T12:00:00Z").getUTCMonth()]}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 6 }}>
          {weekISOs.map((iso, i) => {
            const isToday  = iso === TODAY_ISO;
            const dayNum   = new Date(iso + "T12:00:00Z").getUTCDate();
            const dayTasks = tasks.filter((t) => t.dueDate === iso).sort((a, b) => a.order - b.order);

            return (
              <div
                key={iso}
                style={{
                  background: "var(--color-background-primary)",
                  border: `0.5px solid ${isToday ? "#D85A30" : "var(--color-border-tertiary)"}`,
                  borderRadius: "var(--border-radius-md)",
                  overflow: "hidden",
                }}
              >
                <div style={{ padding: "7px 8px", borderBottom: "0.5px solid var(--color-border-tertiary)", textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "var(--color-text-secondary)" }}>{DAY_ABBR[i]}</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: isToday ? "#D85A30" : "var(--color-text-primary)" }}>
                    {dayNum}
                  </div>
                </div>

                {dayTasks.length === 0 ? (
                  <div style={{ padding: "8px 6px", fontSize: 10, color: "var(--color-text-tertiary)", textAlign: "center" }}>—</div>
                ) : (
                  <div style={{ padding: "4px 0" }}>
                    {dayTasks.slice(0, 3).map((t) => {
                      const col = PRIORITY_PILL_COLORS[t.priority];
                      return (
                        <div
                          key={t.id}
                          title={t.title}
                          style={{
                            margin: "2px 6px",
                            padding: "3px 6px",
                            borderRadius: 4,
                            fontSize: 10,
                            color: "var(--color-text-primary)",
                            background: col.bg,
                            borderLeft: `2px solid ${col.border}`,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {t.title}
                        </div>
                      );
                    })}
                    {dayTasks.length > 3 && (
                      <div style={{ margin: "2px 6px 4px", fontSize: 10, color: "var(--color-text-secondary)" }}>
                        +{dayTasks.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <TaskModal />
    </div>
  );
}
