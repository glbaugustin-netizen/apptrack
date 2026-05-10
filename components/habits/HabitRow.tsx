import { useState } from "react";
import { Habit } from "@/lib/types/habit.types";
import { getColorInfo } from "@/lib/habitColors";

const BAR_HEIGHTS_ON = [8, 11, 7, 12, 9, 10, 10];
const BAR_HEIGHTS_OFF = [4, 5, 4, 5, 4, 5, 4];

interface HabitRowProps {
  habit: Habit;
  done: boolean;
  streak: number;
  weekHistory: boolean[];
  onToggle: () => void;
  onEdit: () => void;
}

export function HabitRow({ habit, done, streak, weekHistory, onToggle, onEdit }: HabitRowProps) {
  const col = getColorInfo(habit.color);
  const [hovered, setHovered] = useState(false);

  const freqLabel =
    habit.frequency === "daily" ? "Chaque jour"
    : habit.frequency === "weekdays" ? "En semaine"
    : habit.frequency === "weekend" ? "Week-end"
    : "Personnalisé";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "var(--color-background-primary)",
        border: `0.5px solid ${hovered ? "var(--color-border-secondary)" : "var(--color-border-tertiary)"}`,
        borderRadius: "var(--border-radius-md)",
        padding: "9px 12px",
        opacity: done ? 0.85 : 1,
        transition: "border-color 0.15s",
        cursor: "default",
      }}
    >
      <i className="ti ti-grip-vertical" style={{ fontSize: 14, color: "var(--color-text-tertiary)", cursor: "grab", flexShrink: 0 }} />

      <div style={{ width: 30, height: 30, borderRadius: "var(--border-radius-md)", background: col.pastel, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, color: col.iconColor, flexShrink: 0 }}>
        <i className={`ti ${habit.icon}`} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {habit.name}
        </div>
        <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 1 }}>{freqLabel}</div>
      </div>

      <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 14, flexShrink: 0 }}>
        {weekHistory.map((filled, i) => (
          <div key={i} style={{ width: 4, borderRadius: 2, height: filled ? BAR_HEIGHTS_ON[i % 7] : BAR_HEIGHTS_OFF[i % 7], background: filled ? habit.color : "var(--color-border-secondary)" }} />
        ))}
      </div>

      {streak > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12, fontWeight: 500, padding: "2px 7px", borderRadius: 20, background: col.pastel, color: col.textColor, whiteSpace: "nowrap", flexShrink: 0 }}>
          <i className="ti ti-flame" style={{ fontSize: 11, color: habit.color }} />
          {streak}j
        </div>
      )}

      <button
        onClick={onEdit}
        style={{
          width: 26, height: 26, border: "none", background: "transparent",
          cursor: "pointer", color: "var(--color-text-tertiary)", display: "flex",
          alignItems: "center", justifyContent: "center", borderRadius: 6, fontSize: 13,
          opacity: hovered ? 1 : 0, transition: "opacity 0.15s",
          flexShrink: 0,
        }}
        title="Modifier"
      >
        <i className="ti ti-pencil" />
      </button>

      <button
        onClick={onToggle}
        style={{ width: 22, height: 22, borderRadius: "50%", border: done ? `1.5px solid ${habit.color}` : "1.5px solid var(--color-border-secondary)", background: done ? habit.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer", transition: "background 0.15s, border-color 0.15s", padding: 0 }}
        title={done ? "Marquer comme non fait" : "Marquer comme fait"}
      >
        <i className="ti ti-check" style={{ fontSize: 12, color: done ? "#fff" : "var(--color-text-tertiary)" }} />
      </button>
    </div>
  );
}
