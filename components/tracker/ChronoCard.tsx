"use client";

import { useState, useEffect } from "react";
import { useTrackerStore, fmtHHMMSS } from "@/lib/store/tracker.store";

export function ChronoCard() {
  const { projects, entries, runningId, startTimer, stopTimer } = useTrackerStore();

  const [description, setDescription] = useState("");
  const [projectId, setProjectId]     = useState<string | null>(projects[0]?.id ?? null);
  const [tag, setTag]                 = useState("");
  const [elapsed, setElapsed]         = useState(0);
  const [showMenu, setShowMenu]       = useState(false);

  const runningEntry  = entries.find((e) => e.id === runningId) ?? null;
  const selectedProj  = projects.find((p) => p.id === projectId);

  // Real-time elapsed counter
  useEffect(() => {
    if (!runningEntry) { setElapsed(0); return; }
    const update = () => {
      const start = new Date(runningEntry.startAt + ":00").getTime();
      setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [runningEntry?.id, runningEntry?.startAt]);

  function handleStart() {
    if (!description.trim()) return;
    startTimer(description.trim(), projectId, tag.replace(/^#\s*/, ""));
    setDescription("");
    setTag("");
  }

  function handleStop() {
    stopTimer();
  }

  const canStart = !runningEntry && description.trim().length > 0;

  return (
    <div style={{
      background: "var(--color-background-primary)",
      border: "0.5px solid var(--color-border-tertiary)",
      borderRadius: "var(--border-radius-lg)",
      padding: 16,
    }}>
      {/* Top row: description + project selector + tag */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <input
          type="text"
          value={runningEntry ? runningEntry.description : description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Sur quoi tu travailles ?"
          disabled={!!runningEntry}
          onKeyDown={(e) => { if (e.key === "Enter" && !runningEntry) handleStart(); }}
          style={{
            flex: 1, padding: "8px 10px",
            border: "0.5px solid var(--color-border-secondary)",
            borderRadius: "var(--border-radius-md)",
            fontSize: 13, outline: "none",
            background: "var(--color-background-primary)",
            color: "var(--color-text-primary)",
            opacity: runningEntry ? 0.7 : 1,
          }}
        />

        {/* Project selector */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => { if (!runningEntry) setShowMenu((v) => !v); }}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 10px",
              border: "0.5px solid var(--color-border-tertiary)",
              borderRadius: "var(--border-radius-md)",
              fontSize: 12, background: "var(--color-background-primary)",
              color: "var(--color-text-secondary)",
              cursor: runningEntry ? "default" : "pointer",
              whiteSpace: "nowrap", opacity: runningEntry ? 0.7 : 1,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: selectedProj?.color ?? "#888780", flexShrink: 0 }} />
            {selectedProj?.name ?? "Aucun projet"}
            <i className="ti ti-chevron-down" style={{ fontSize: 11 }} />
          </button>
          {showMenu && (
            <div
              style={{
                position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 20,
                background: "var(--color-background-primary)",
                border: "0.5px solid var(--color-border-tertiary)",
                borderRadius: "var(--border-radius-md)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                minWidth: 160,
              }}
            >
              {projects.filter((p) => !p.archived).map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setProjectId(p.id); setShowMenu(false); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    width: "100%", padding: "8px 12px",
                    border: "none", cursor: "pointer", textAlign: "left",
                    fontSize: 12, color: "var(--color-text-primary)",
                    background: p.id === projectId ? "var(--color-background-secondary)" : "transparent",
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tag */}
        <input
          type="text"
          value={runningEntry ? (runningEntry.tags[0] ? `#${runningEntry.tags[0]}` : "") : tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder="# tag"
          disabled={!!runningEntry}
          style={{
            width: 90, padding: "7px 10px",
            border: "0.5px solid var(--color-border-tertiary)",
            borderRadius: "var(--border-radius-md)",
            fontSize: 12, outline: "none",
            background: "var(--color-background-primary)",
            color: "var(--color-text-secondary)",
            opacity: runningEntry ? 0.7 : 1,
          }}
        />
      </div>

      {/* Bottom row: timer display + button */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div
            className="tabular-nums"
            style={{
              fontSize: 36, fontWeight: 500, letterSpacing: "0.02em",
              fontFamily: "var(--font-mono)",
              color: runningEntry ? "#1D9E75" : "var(--color-text-primary)",
            }}
          >
            {fmtHHMMSS(elapsed)}
          </div>
          {runningEntry && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#1D9E75", marginTop: 4 }}>
              <span className="pulse-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "#1D9E75", display: "inline-block" }} />
              En cours — {runningEntry.description}
            </div>
          )}
        </div>

        {runningEntry ? (
          <button
            onClick={handleStop}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 20px", background: "#E24B4A", color: "#fff", border: "none", borderRadius: "var(--border-radius-md)", fontSize: 14, cursor: "pointer", fontWeight: 500 }}
          >
            <i className="ti ti-player-stop" style={{ fontSize: 16 }} />
            Arrêter
          </button>
        ) : (
          <button
            onClick={handleStart}
            disabled={!canStart}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 20px", background: canStart ? "#1D9E75" : "var(--color-border-tertiary)", color: canStart ? "#fff" : "var(--color-text-tertiary)", border: "none", borderRadius: "var(--border-radius-md)", fontSize: 14, cursor: canStart ? "pointer" : "not-allowed", fontWeight: 500 }}
          >
            <i className="ti ti-player-play" style={{ fontSize: 16 }} />
            Démarrer
          </button>
        )}
      </div>
    </div>
  );
}
