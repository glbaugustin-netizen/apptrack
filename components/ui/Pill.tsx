import { CSSProperties } from "react";

interface PillProps {
  active?: boolean;
  accent?: string;
  accentPastel?: string;
  accentDark?: string;
  onClick?: () => void;
  children: React.ReactNode;
  style?: CSSProperties;
}

export function Pill({
  active = false,
  accent = "#7F77DD",
  accentPastel = "#EEEDFE",
  accentDark = "#534AB7",
  onClick,
  children,
  style,
}: PillProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 10px",
        borderRadius: 20,
        fontSize: 11,
        cursor: "pointer",
        border: active
          ? `1px solid ${accent}`
          : "0.5px solid var(--color-border-tertiary)",
        background: active ? accentPastel : "transparent",
        color: active ? accentDark : "var(--color-text-secondary)",
        fontWeight: active ? 500 : 400,
        transition: "background 0.1s, color 0.1s, border-color 0.1s",
        lineHeight: 1.4,
        ...style,
      }}
    >
      {children}
    </button>
  );
}
