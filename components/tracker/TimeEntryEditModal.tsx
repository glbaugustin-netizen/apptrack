"use client";

import { useState, useEffect } from "react";
import { useTrackerStore } from "@/lib/store/tracker.store";
import { useAuthStore } from "@/lib/store/auth.store";

export function TimeEntryEditModal() {
  const { editingEntry, closeEditEntry, updateEntry, deleteEntry, projects } = useTrackerStore();
  const uid = useAuthStore((s) => s.user?.uid ?? "");

  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [tag, setTag] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");

  useEffect(() => {
    if (editingEntry) {
      setDescription(editingEntry.description);
      setProjectId(editingEntry.projectId);
      setTag(editingEntry.tags[0] ?? "");
      setStartAt(editingEntry.startAt.slice(0, 16));
      setEndAt(editingEntry.endAt ? editingEntry.endAt.slice(0, 16) : "");
    }
  }, [editingEntry]);

  function handleSave() {
    if (!editingEntry || !description.trim()) return;
    updateEntry(uid, editingEntry.id, {
      description: description.trim(),
      projectId,
      tags: tag.trim() ? [tag.trim().replace(/^#\s*/, "")] : [],
      startAt: startAt.length === 16 ? startAt + ":00" : startAt,
      endAt: endAt ? (endAt.length === 16 ? endAt + ":00" : endAt) : editingEntry.endAt,
    });
  }

  function handleDelete() {
    if (!editingEntry) return;
    deleteEntry(uid, editingEntry.id);
    closeEditEntry();
  }

  if (!editingEntry) return null;

  const selectedProj = projects.find((p) => p.id === projectId);

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.32)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }}
      onClick={(e) => { if (e.target === e.currentTarget) closeEditEntry(); }}
    >
      <div
        style={{ background: "var(--color-background-primary)", borderRadius: "var(--border-radius-xl)", border: "0.5px solid var(--color-border-tertiary)", width: "100%", maxWidth: 420, overflow: "hidden" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
          <span style={{ fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)" }}>Modifier l&apos;entrée</span>
          <button onClick={closeEditEntry} style={{ width: 24, height: 24, border: "none", background: "transparent", cursor: "pointer", color: "var(--color-text-secondary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, padding: 0 }}>
            <i className="ti ti-x" />
          </button>
        </div>

        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Description */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 5 }}>Description</label>
            <input
              type="text" value={description} onChange={(e) => setDescription(e.target.value)}
              autoFocus
              style={{ width: "100%", padding: "8px 10px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", fontSize: 14, background: "var(--color-background-primary)", color: "var(--color-text-primary)", outline: "none" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#1D9E75"; e.currentTarget.style.boxShadow = "0 0 0 2px #1D9E7533"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border-secondary)"; e.currentTarget.style.boxShadow = "none"; }}
            />
          </div>

          {/* Project */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 5 }}>Projet</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button
                onClick={() => setProjectId(null)}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", border: !projectId ? "1px solid #1D9E75" : "0.5px solid var(--color-border-tertiary)", borderRadius: 20, fontSize: 12, cursor: "pointer", background: !projectId ? "#E6F7F2" : "transparent", color: !projectId ? "#1D9E75" : "var(--color-text-secondary)", fontWeight: !projectId ? 500 : 400 }}
              >
                Aucun
              </button>
              {projects.filter((p) => !p.archived).map((p) => {
                const sel = p.id === projectId;
                return (
                  <button
                    key={p.id} onClick={() => setProjectId(p.id)}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", border: sel ? `1px solid ${p.color}` : "0.5px solid var(--color-border-tertiary)", borderRadius: 20, fontSize: 12, cursor: "pointer", background: sel ? `${p.color}20` : "transparent", color: sel ? p.color : "var(--color-text-secondary)", fontWeight: sel ? 500 : 400 }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tag */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 5 }}>Tag</label>
            <input
              type="text" value={tag} onChange={(e) => setTag(e.target.value)}
              placeholder="# design, dev…"
              style={{ width: "100%", padding: "8px 10px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", fontSize: 13, background: "var(--color-background-primary)", color: "var(--color-text-primary)", outline: "none" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#1D9E75"; e.currentTarget.style.boxShadow = "0 0 0 2px #1D9E7533"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border-secondary)"; e.currentTarget.style.boxShadow = "none"; }}
            />
          </div>

          {/* Start / End */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 5 }}>Début</label>
              <input
                type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)}
                style={{ width: "100%", padding: "7px 10px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", fontSize: 12, background: "var(--color-background-primary)", color: "var(--color-text-primary)", outline: "none" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#1D9E75"; e.currentTarget.style.boxShadow = "0 0 0 2px #1D9E7533"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border-secondary)"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 5 }}>Fin</label>
              <input
                type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)}
                style={{ width: "100%", padding: "7px 10px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", fontSize: 12, background: "var(--color-background-primary)", color: "var(--color-text-primary)", outline: "none" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#1D9E75"; e.currentTarget.style.boxShadow = "0 0 0 2px #1D9E7533"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border-secondary)"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>
          </div>

          {/* Preview durée */}
          {startAt && endAt && (
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)", background: "var(--color-background-secondary)", padding: "6px 10px", borderRadius: "var(--border-radius-md)" }}>
              Durée calculée : <strong style={{ color: "var(--color-text-primary)" }}>
                {(() => {
                  const secs = Math.max(Math.floor((new Date(endAt).getTime() - new Date(startAt).getTime()) / 1000), 0);
                  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
                  if (h === 0 && m === 0) return `${s}s`;
                  if (h === 0) return `${m}min ${s}s`;
                  return `${h}h ${m}min`;
                })()}
              </strong>
              {selectedProj && <span> · <span style={{ color: selectedProj.color }}>⬤</span> {selectedProj.name}</span>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "12px 16px", borderTop: "0.5px solid var(--color-border-tertiary)" }}>
          <button onClick={handleDelete} style={{ padding: "6px 14px", border: "0.5px solid #E24B4A", borderRadius: "var(--border-radius-md)", background: "transparent", fontSize: 13, cursor: "pointer", color: "var(--color-text-danger)" }}>
            Supprimer
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={closeEditEntry} style={{ padding: "6px 14px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "transparent", fontSize: 13, cursor: "pointer", color: "var(--color-text-secondary)" }}>
              Annuler
            </button>
            <button
              onClick={handleSave} disabled={!description.trim()}
              style={{ padding: "6px 14px", background: description.trim() ? "#1D9E75" : "var(--color-border-tertiary)", color: description.trim() ? "#fff" : "var(--color-text-tertiary)", border: "none", borderRadius: "var(--border-radius-md)", fontSize: 13, cursor: description.trim() ? "pointer" : "not-allowed", fontWeight: 500 }}
            >
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
