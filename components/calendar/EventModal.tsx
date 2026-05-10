"use client";

import { useState, useEffect } from "react";
import { EventCategory, CATEGORY_CONFIG, EVENT_COLORS } from "@/lib/types/event.types";
import { useCalendarStore } from "@/lib/store/calendar.store";
import { useAuthStore } from "@/lib/store/auth.store";

const CATEGORIES = Object.entries(CATEGORY_CONFIG) as [EventCategory, (typeof CATEGORY_CONFIG)[EventCategory]][];

export function EventModal() {
  const { isModalOpen, closeModal, addEvent, modalInitialDate } = useCalendarStore();
  const uid = useAuthStore((s) => s.user?.uid ?? "");

  const [title, setTitle]       = useState("");
  const [startAt, setStartAt]   = useState("");
  const [endAt, setEndAt]       = useState("");
  const [category, setCategory] = useState<EventCategory>("work");
  const [color, setColor]       = useState<string>(EVENT_COLORS[0]);

  useEffect(() => {
    if (isModalOpen) {
      setTitle("");
      setCategory("work");
      setColor(EVENT_COLORS[0]);
      const date = modalInitialDate ?? new Date().toISOString().slice(0, 10);
      setStartAt(`${date}T09:00`);
      setEndAt(`${date}T10:00`);
    }
  }, [isModalOpen, modalInitialDate]);

  function handleSubmit() {
    if (!title.trim()) return;
    addEvent(uid, { title: title.trim(), startAt, endAt, allDay: false, category, color });
    closeModal();
  }

  if (!isModalOpen) return null;

  const cfg = CATEGORY_CONFIG[category];

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
      onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
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
            Nouvel événement
          </span>
          <button
            onClick={closeModal}
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
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Titre */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 4 }}>
              Titre
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex : Réunion équipe, Médecin..."
              autoFocus
              style={{
                width: "100%",
                padding: "7px 10px",
                border: "0.5px solid var(--color-border-secondary)",
                borderRadius: "var(--border-radius-md)",
                fontSize: 13,
                background: "var(--color-background-primary)",
                color: "var(--color-text-primary)",
                outline: "none",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#378ADD";
                e.currentTarget.style.boxShadow = "0 0 0 2px #378ADD33";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border-secondary)";
                e.currentTarget.style.boxShadow = "none";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
                if (e.key === "Escape") closeModal();
              }}
            />
          </div>

          {/* Début / Fin */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 4 }}>Début</label>
              <input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  border: "0.5px solid var(--color-border-secondary)",
                  borderRadius: "var(--border-radius-md)",
                  fontSize: 12,
                  background: "var(--color-background-primary)",
                  color: "var(--color-text-primary)",
                  outline: "none",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#378ADD"; e.currentTarget.style.boxShadow = "0 0 0 2px #378ADD33"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border-secondary)"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 4 }}>Fin</label>
              <input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  border: "0.5px solid var(--color-border-secondary)",
                  borderRadius: "var(--border-radius-md)",
                  fontSize: 12,
                  background: "var(--color-background-primary)",
                  color: "var(--color-text-primary)",
                  outline: "none",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#378ADD"; e.currentTarget.style.boxShadow = "0 0 0 2px #378ADD33"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border-secondary)"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>
          </div>

          {/* Catégorie */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 4 }}>
              Catégorie
            </label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {CATEGORIES.map(([key, cat]) => {
                const sel = key === category;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setCategory(key);
                      setColor(cat.color);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "4px 10px",
                      border: sel ? `0.5px solid ${cat.color}` : "0.5px solid var(--color-border-tertiary)",
                      borderRadius: 20,
                      fontSize: 11,
                      cursor: "pointer",
                      background: sel ? cat.bg : "transparent",
                      color: sel ? cat.text : "var(--color-text-secondary)",
                      fontWeight: sel ? 500 : 400,
                      transition: "all 0.1s",
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: cat.color, flexShrink: 0 }} />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Couleur */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 4 }}>
              Couleur
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              {EVENT_COLORS.map((hex) => {
                const sel = hex === color;
                return (
                  <button
                    key={hex}
                    onClick={() => setColor(hex)}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: hex,
                      border: sel ? "2px solid var(--color-text-primary)" : "2px solid transparent",
                      cursor: "pointer",
                      padding: 0,
                      flexShrink: 0,
                      transition: "border-color 0.1s",
                    }}
                    title={hex}
                  />
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
            onClick={closeModal}
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
            disabled={!title.trim()}
            style={{
              padding: "6px 14px",
              background: title.trim() ? "#378ADD" : "var(--color-border-tertiary)",
              color: title.trim() ? "#fff" : "var(--color-text-tertiary)",
              border: "none",
              borderRadius: "var(--border-radius-md)",
              fontSize: 13,
              cursor: title.trim() ? "pointer" : "not-allowed",
              fontWeight: 500,
              transition: "background 0.15s",
            }}
          >
            Créer l&apos;événement
          </button>
        </div>
      </div>
    </div>
  );
}
