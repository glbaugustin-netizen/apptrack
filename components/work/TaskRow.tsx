import { useState } from "react";
import { Task } from "@/lib/types/task.types";

interface TaskRowProps {
  task: Task;
  onToggle: () => void;
  onEdit?: () => void;
  dragHandleListeners?: React.HTMLAttributes<HTMLElement>;
  dragHandleAttributes?: React.HTMLAttributes<HTMLElement>;
}

function PriorityBadge({ priority }: { priority: Task["priority"] }) {
  const config = {
    high:   { label: "Haute",   icon: "ti-arrow-up",   bg: "#FCEBEB", color: "#A32D2D" },
    medium: { label: "Moyenne", icon: "ti-minus",       bg: "#FAEEDA", color: "#633806" },
    low:    { label: "Basse",   icon: "ti-arrow-down", bg: "#EAF3DE", color: "#27500A" },
  }[priority];

  return (
    <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12, padding: "2px 7px", borderRadius: 20, background: config.bg, color: config.color, fontWeight: 500, whiteSpace: "nowrap", flexShrink: 0 }}>
      <i className={`ti ${config.icon}`} style={{ fontSize: 10 }} />
      {config.label}
    </span>
  );
}

function StatusBadge({ status }: { status: Task["status"] }) {
  const config = {
    todo:        { label: "À faire",  bg: "var(--color-background-secondary)", color: "var(--color-text-secondary)" },
    in_progress: { label: "En cours", bg: "#E6F1FB", color: "#185FA5" },
    done:        { label: "Terminée", bg: "#EAF3DE", color: "#27500A" },
  }[status];

  return (
    <span style={{ fontSize: 12, padding: "2px 7px", borderRadius: 20, background: config.bg, color: config.color, fontWeight: 500, whiteSpace: "nowrap", flexShrink: 0 }}>
      {config.label}
    </span>
  );
}

export function TaskRow({ task, onToggle, onEdit, dragHandleListeners, dragHandleAttributes }: TaskRowProps) {
  const isDone = task.status === "done";
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--color-background-primary)", border: `0.5px solid ${hovered ? "var(--color-border-secondary)" : "var(--color-border-tertiary)"}`, borderRadius: "var(--border-radius-md)", padding: "9px 12px", opacity: isDone ? 0.55 : 1, transition: "border-color 0.15s", cursor: "default" }}
    >
      <i
        className="ti ti-grip-vertical"
        style={{ fontSize: 14, color: "var(--color-text-tertiary)", cursor: "grab", flexShrink: 0, touchAction: "none" }}
        {...(dragHandleListeners ?? {})}
        {...(dragHandleAttributes ?? {})}
      />

      <button
        onClick={onToggle}
        style={{ width: 18, height: 18, borderRadius: 4, border: isDone ? "1.5px solid #D85A30" : "1.5px solid var(--color-border-secondary)", background: isDone ? "#D85A30" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer", padding: 0, transition: "background 0.15s, border-color 0.15s" }}
        title={isDone ? "Marquer comme non terminée" : "Marquer comme terminée"}
      >
        {isDone && <i className="ti ti-check" style={{ fontSize: 11, color: "#fff" }} />}
      </button>

      <span style={{ flex: 1, fontSize: 14, color: isDone ? "var(--color-text-secondary)" : "var(--color-text-primary)", textDecoration: isDone ? "line-through" : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
        {task.title}
      </span>

      <PriorityBadge priority={task.priority} />
      <StatusBadge status={task.status} />

      {onEdit && (
        <button
          onClick={onEdit}
          style={{ width: 26, height: 26, border: "none", background: "transparent", cursor: "pointer", color: "var(--color-text-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, fontSize: 13, opacity: hovered ? 1 : 0, transition: "opacity 0.15s", flexShrink: 0 }}
          title="Modifier"
        >
          <i className="ti ti-pencil" />
        </button>
      )}
    </div>
  );
}
