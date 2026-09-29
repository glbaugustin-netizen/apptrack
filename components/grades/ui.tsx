"use client";

import { useEffect, useState, type ButtonHTMLAttributes, type CSSProperties, type FocusEvent, type ReactNode } from "react";
import { fmtDelta } from "@/lib/store/grades.store";

// Accent du module Tracking (rampe rose de la charte)
export const ACCENT = "#D4537E";

export const CARD: CSSProperties = {
  background: "var(--color-background-primary)",
  border: "0.5px solid var(--color-border-tertiary)",
  borderRadius: "var(--border-radius-lg)",
  padding: 16,
};

export const CARD_TITLE: CSSProperties = { fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" };

export const LABEL: CSSProperties = { display: "block", fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 5 };

export const INPUT: CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  border: "0.5px solid var(--color-border-secondary)",
  borderRadius: "var(--border-radius-md)",
  fontSize: 14,
  background: "var(--color-background-primary)",
  color: "var(--color-text-primary)",
  outline: "none",
};

export const focusRing = {
  onFocus: (e: FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.boxShadow = `0 0 0 2px ${ACCENT}33`; },
  onBlur: (e: FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = "var(--color-border-secondary)"; e.currentTarget.style.boxShadow = "none"; },
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { icon?: string };

const BUTTON_BASE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  padding: "6px 12px",
  borderRadius: "var(--border-radius-md)",
  fontSize: 13,
  whiteSpace: "nowrap",
  cursor: "pointer",
};

export function PrimaryButton({ icon, children, disabled, style, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled}
      style={{ ...BUTTON_BASE, background: disabled ? "var(--color-border-tertiary)" : ACCENT, color: disabled ? "var(--color-text-tertiary)" : "#fff", border: "none", fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer", ...style }}
    >
      {icon && <i className={`ti ${icon}`} style={{ fontSize: 14 }} />}
      {children}
    </button>
  );
}

export function SecondaryButton({ icon, children, style, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      style={{ ...BUTTON_BASE, background: "transparent", color: "var(--color-text-secondary)", border: "0.5px solid var(--color-border-secondary)", ...style }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-background-secondary)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      {icon && <i className={`ti ${icon}`} style={{ fontSize: 14 }} />}
      {children}
    </button>
  );
}

/** Premier clic : demande confirmation. Second clic dans les 4 s : supprime. */
export function ConfirmDeleteButton({ label, confirmLabel, onConfirm, iconOnly }: { label: string; confirmLabel: string; onConfirm: () => void; iconOnly?: boolean }) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);

  return (
    <button
      onClick={() => (armed ? onConfirm() : setArmed(true))}
      title={label}
      aria-label={armed ? confirmLabel : label}
      style={{
        ...BUTTON_BASE,
        padding: iconOnly && !armed ? "6px 8px" : BUTTON_BASE.padding,
        background: armed ? "#E24B4A" : "transparent",
        color: armed ? "#fff" : "var(--color-text-danger)",
        border: armed ? "0.5px solid #E24B4A" : "0.5px solid var(--color-border-secondary)",
        fontWeight: armed ? 500 : 400,
      }}
    >
      <i className="ti ti-trash" style={{ fontSize: 14 }} />
      {armed ? confirmLabel : !iconOnly && label}
    </button>
  );
}

/** Écart signé avec flèche : la couleur n'est jamais le seul indice. */
export function Delta({ value, suffix, size = 11 }: { value: number; suffix?: string; size?: number }) {
  const r = Math.round(value * 100) / 100;
  const color = r > 0 ? "var(--color-text-success)" : r < 0 ? "var(--color-text-danger)" : "var(--color-text-secondary)";
  const icon = r > 0 ? "ti-arrow-up-right" : r < 0 ? "ti-arrow-down-right" : "ti-arrow-right";
  return (
    <span className="tabular-nums" style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: size, fontWeight: 500, color, whiteSpace: "nowrap" }}>
      <i className={`ti ${icon}`} style={{ fontSize: size + 1 }} />
      {fmtDelta(r)}{suffix}
    </span>
  );
}

export function PageMessage({ icon, title, text, action }: { icon: string; title: string; text?: string; action?: ReactNode }) {
  return (
    <div style={{ ...CARD, padding: "36px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center" }}>
      <div style={{ width: 40, height: 40, borderRadius: "50%", background: `${ACCENT}1F`, color: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
        <i className={`ti ${icon}`} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)" }}>{title}</div>
      {text && <div style={{ fontSize: 12, color: "var(--color-text-secondary)", maxWidth: 380, lineHeight: 1.6 }}>{text}</div>}
      {action && <div style={{ marginTop: 6 }}>{action}</div>}
    </div>
  );
}

export function PageLoading() {
  return <div style={{ padding: 20, fontSize: 13, color: "var(--color-text-secondary)" }}>Chargement…</div>;
}
