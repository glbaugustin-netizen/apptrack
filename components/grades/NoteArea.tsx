"use client";

import { useEffect, useRef, useState } from "react";
import { ACCENT, CARD_TITLE } from "./ui";

type Status = "idle" | "pending" | "saved" | "error";

const STATUS_LABEL: Record<Status, string> = {
  idle: "",
  pending: "Enregistrement…",
  saved: "Enregistré",
  error: "Erreur d'enregistrement",
};

const SAVE_DELAY_MS = 600;

/** Zone d'écriture enregistrée automatiquement (pendant la frappe, à la sortie du champ et en quittant la page). */
export function NoteArea({ icon, title, placeholder, initial, onSave }: {
  icon: string;
  title: string;
  placeholder: string;
  initial: string;
  onSave: (text: string) => Promise<void>;
}) {
  const [text, setText] = useState(initial);
  const [status, setStatus] = useState<Status>("idle");
  const [focused, setFocused] = useState(false);

  const latest = useRef(initial);
  const saved = useRef<string | null>(initial); // null = dernier enregistrement en échec
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);
  const saveRef = useRef(onSave);
  saveRef.current = onSave;

  function flush() {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    const value = latest.current;
    if (value === saved.current) {
      if (mounted.current) setStatus((s) => (s === "pending" ? "saved" : s));
      return;
    }
    saved.current = value;
    saveRef.current(value)
      .then(() => { if (mounted.current && latest.current === value) setStatus("saved"); })
      .catch((err) => {
        console.error(err);
        saved.current = null;
        if (mounted.current) setStatus("error");
      });
  }

  // flush ne lit que des refs : l'enregistrer une seule fois suffit
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; flush(); };
  }, []);

  function handleChange(value: string) {
    setText(value);
    latest.current = value;
    setStatus("pending");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, SAVE_DELAY_MS);
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        background: "var(--color-background-primary)",
        border: `0.5px solid ${focused ? ACCENT : "var(--color-border-tertiary)"}`,
        borderRadius: "var(--border-radius-lg)",
        boxShadow: focused ? `0 0 0 2px ${ACCENT}33` : "none",
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px 0" }}>
        <i className={`ti ${icon}`} style={{ fontSize: 16, color: ACCENT }} />
        <span style={CARD_TITLE}>{title}</span>
        <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: status === "error" ? "var(--color-text-danger)" : "var(--color-text-tertiary)" }} aria-live="polite">
          {status === "saved" && <i className="ti ti-check" style={{ fontSize: 12 }} />}
          {STATUS_LABEL[status]}
        </span>
      </div>
      <textarea
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); flush(); }}
        placeholder={placeholder}
        aria-label={title}
        rows={9}
        style={{ flex: 1, minHeight: 200, width: "100%", resize: "vertical", border: "none", outline: "none", background: "transparent", padding: "10px 16px 16px", fontSize: 14, lineHeight: 1.7, color: "var(--color-text-primary)", fontFamily: "inherit" }}
      />
    </div>
  );
}
