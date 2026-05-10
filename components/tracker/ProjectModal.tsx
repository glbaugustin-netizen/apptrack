"use client";

import { useState } from "react";
import { useTrackerStore } from "@/lib/store/tracker.store";
import { useAuthStore } from "@/lib/store/auth.store";

const PROJECT_COLORS = [
  "#7F77DD", "#1D9E75", "#D85A30", "#378ADD", "#E24B4A",
  "#EF9F27", "#639922", "#885DA0", "#3B82F6", "#EC4899",
  "#14B8A6", "#F59E0B", "#6366F1", "#84CC16", "#F97316",
];

interface ProjectModalProps {
  open: boolean;
  onClose: () => void;
}

export function ProjectModal({ open, onClose }: ProjectModalProps) {
  const addProject = useTrackerStore((s) => s.addProject);
  const uid = useAuthStore((s) => s.user?.uid ?? "");

  const [name, setName] = useState("");
  const [color, setColor] = useState(PROJECT_COLORS[0]);

  function handleSubmit() {
    if (!name.trim()) return;
    addProject(uid, name.trim(), color);
    setName("");
    setColor(PROJECT_COLORS[0]);
    onClose();
  }

  if (!open) return null;

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.32)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{ background: "var(--color-background-primary)", borderRadius: "var(--border-radius-xl)", border: "0.5px solid var(--color-border-tertiary)", width: "100%", maxWidth: 360, overflow: "hidden" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <span style={{ fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)" }}>Nouveau projet</span>
          <button onClick={onClose} style={{ width: 24, height: 24, border: "none", background: "transparent", cursor: "pointer", color: "var(--color-text-secondary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, padding: 0 }}>
            <i className="ti ti-x" />
          </button>
        </div>

        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 5 }}>Nom du projet</label>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Ex: AppTrack, Design, Marketing…" autoFocus
              style={{ width: "100%", padding: "8px 10px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", fontSize: 14, background: "var(--color-background-primary)", color: "var(--color-text-primary)", outline: "none" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#1D9E75"; e.currentTarget.style.boxShadow = "0 0 0 2px #1D9E7533"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border-secondary)"; e.currentTarget.style.boxShadow = "none"; }}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); if (e.key === "Escape") onClose(); }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 8 }}>Couleur</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {PROJECT_COLORS.map((hex) => {
                const sel = hex === color;
                return (
                  <button
                    key={hex} onClick={() => setColor(hex)}
                    style={{ width: 26, height: 26, borderRadius: "50%", background: hex, border: sel ? "2.5px solid var(--color-text-primary)" : "2.5px solid transparent", cursor: "pointer", padding: 0, flexShrink: 0, transition: "border-color 0.1s" }}
                    title={hex}
                  />
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className="ti ti-folder" style={{ fontSize: 16, color: "#fff" }} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)" }}>{name || "Aperçu du projet"}</span>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 16px", borderTop: "0.5px solid var(--color-border-tertiary)" }}>
          <button onClick={onClose} style={{ padding: "6px 14px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "transparent", fontSize: 13, cursor: "pointer", color: "var(--color-text-secondary)" }}>
            Annuler
          </button>
          <button
            onClick={handleSubmit} disabled={!name.trim()}
            style={{ padding: "6px 14px", background: name.trim() ? "#1D9E75" : "var(--color-border-tertiary)", color: name.trim() ? "#fff" : "var(--color-text-tertiary)", border: "none", borderRadius: "var(--border-radius-md)", fontSize: 13, cursor: name.trim() ? "pointer" : "not-allowed", fontWeight: 500 }}
          >
            Créer le projet
          </button>
        </div>
      </div>
    </div>
  );
}
