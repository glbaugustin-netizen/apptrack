"use client";

import { useState } from "react";
import { HabitFrequency } from "@/lib/types/habit.types";
import { HABIT_ICONS, HABIT_COLORS } from "@/lib/habitColors";
import { useHabitsStore } from "@/lib/store/habits.store";

const FREQ_OPTIONS: { value: HabitFrequency; label: string }[] = [
  { value: "daily", label: "Chaque jour" },
  { value: "weekdays", label: "En semaine" },
  { value: "weekend", label: "Week-end" },
  { value: "custom", label: "Personnalisé" },
];

export function HabitModal() {
  const { isModalOpen, closeModal, addHabit } = useHabitsStore();

  const [name, setName] = useState("");
  const [icon, setIcon] = useState<string>(HABIT_ICONS[0]);
  const [color, setColor] = useState<string>(HABIT_COLORS[0].hex);
  const [frequency, setFrequency] = useState<HabitFrequency>("daily");

  function handleSubmit() {
    if (!name.trim()) return;
    addHabit({ name: name.trim(), icon, color, frequency });
    handleClose();
  }

  function handleClose() {
    setName("");
    setIcon(HABIT_ICONS[0]);
    setColor(HABIT_COLORS[0].hex);
    setFrequency("daily");
    closeModal();
  }

  if (!isModalOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.32)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        style={{
          background: "var(--color-background-primary)",
          borderRadius: "var(--border-radius-xl)",
          border: "0.5px solid var(--color-border-tertiary)",
          width: "100%",
          maxWidth: 400,
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            borderBottom: "0.5px solid var(--color-border-tertiary)",
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)" }}>
            Nouvelle habitude
          </span>
          <button
            onClick={handleClose}
            style={{
              width: 24,
              height: 24,
              borderRadius: "var(--border-radius-md)",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "var(--color-text-secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              padding: 0,
            }}
          >
            <i className="ti ti-x" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Nom */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: "var(--color-text-secondary)",
                marginBottom: 5,
              }}
            >
              Nom
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Méditation, Sport, Lecture..."
              autoFocus
              style={{
                width: "100%",
                padding: "8px 10px",
                border: "0.5px solid var(--color-border-secondary)",
                borderRadius: "var(--border-radius-md)",
                fontSize: 13,
                background: "var(--color-background-primary)",
                color: "var(--color-text-primary)",
                outline: "none",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#7F77DD";
                e.currentTarget.style.boxShadow = "0 0 0 2px #7F77DD33";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border-secondary)";
                e.currentTarget.style.boxShadow = "none";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
                if (e.key === "Escape") handleClose();
              }}
            />
          </div>

          {/* Icône */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: "var(--color-text-secondary)",
                marginBottom: 5,
              }}
            >
              Icône
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(8, 1fr)",
                gap: 6,
              }}
            >
              {HABIT_ICONS.map((ic) => {
                const sel = ic === icon;
                return (
                  <button
                    key={ic}
                    onClick={() => setIcon(ic)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "var(--border-radius-md)",
                      border: sel
                        ? "1px solid #7F77DD"
                        : "0.5px solid var(--color-border-tertiary)",
                      background: sel ? "#EEEDFE" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      fontSize: 17,
                      color: sel ? "#534AB7" : "var(--color-text-secondary)",
                      padding: 0,
                      transition: "border-color 0.1s, background 0.1s, color 0.1s",
                    }}
                    title={ic.replace("ti-", "")}
                  >
                    <i className={`ti ${ic}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Couleur */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: "var(--color-text-secondary)",
                marginBottom: 5,
              }}
            >
              Couleur
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {HABIT_COLORS.map((c) => {
                const sel = c.hex === color;
                return (
                  <button
                    key={c.hex}
                    onClick={() => setColor(c.hex)}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      background: c.hex,
                      border: sel
                        ? "2px solid var(--color-text-primary)"
                        : "2px solid transparent",
                      cursor: "pointer",
                      padding: 0,
                      flexShrink: 0,
                      transition: "border-color 0.1s",
                    }}
                    title={c.hex}
                  />
                );
              })}
            </div>
          </div>

          {/* Fréquence */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                color: "var(--color-text-secondary)",
                marginBottom: 5,
              }}
            >
              Fréquence
            </label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {FREQ_OPTIONS.map((opt) => {
                const sel = opt.value === frequency;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setFrequency(opt.value)}
                    style={{
                      padding: "5px 12px",
                      border: sel
                        ? "1px solid #7F77DD"
                        : "0.5px solid var(--color-border-tertiary)",
                      borderRadius: 20,
                      fontSize: 12,
                      cursor: "pointer",
                      background: sel ? "#EEEDFE" : "transparent",
                      color: sel ? "#534AB7" : "var(--color-text-secondary)",
                      fontWeight: sel ? 500 : 400,
                      transition: "all 0.1s",
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            padding: "12px 16px",
            borderTop: "0.5px solid var(--color-border-tertiary)",
          }}
        >
          <button
            onClick={handleClose}
            style={{
              padding: "6px 14px",
              border: "0.5px solid var(--color-border-secondary)",
              borderRadius: "var(--border-radius-md)",
              background: "transparent",
              fontSize: 13,
              cursor: "pointer",
              color: "var(--color-text-secondary)",
            }}
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            style={{
              padding: "6px 14px",
              background: name.trim() ? "#7F77DD" : "var(--color-border-tertiary)",
              color: name.trim() ? "#fff" : "var(--color-text-tertiary)",
              border: "none",
              borderRadius: "var(--border-radius-md)",
              fontSize: 13,
              cursor: name.trim() ? "pointer" : "not-allowed",
              fontWeight: 500,
              transition: "background 0.15s",
            }}
          >
            Créer l&apos;habitude
          </button>
        </div>
      </div>
    </div>
  );
}
