import { CSSProperties } from "react";

type BadgeVariant = "priority-high" | "priority-medium" | "priority-low" | "status-todo" | "status-in_progress" | "status-done" | "streak" | "tag" | "custom";

interface BadgeProps {
  variant?: BadgeVariant;
  icon?: string;
  children: React.ReactNode;
  bg?: string;
  color?: string;
  style?: CSSProperties;
}

const variantMap: Record<BadgeVariant, { bg: string; color: string; icon?: string }> = {
  "priority-high":     { bg: "#FCEBEB", color: "#A32D2D", icon: "ti-arrow-up" },
  "priority-medium":   { bg: "#FAEEDA", color: "#633806", icon: "ti-minus" },
  "priority-low":      { bg: "#EAF3DE", color: "#27500A", icon: "ti-arrow-down" },
  "status-todo":       { bg: "var(--color-background-secondary)", color: "var(--color-text-secondary)" },
  "status-in_progress":{ bg: "#E6F1FB", color: "#185FA5" },
  "status-done":       { bg: "#EAF3DE", color: "#27500A" },
  "streak":            { bg: "#EEEDFE", color: "#534AB7", icon: "ti-flame" },
  "tag":               { bg: "var(--color-background-secondary)", color: "var(--color-text-secondary)" },
  "custom":            { bg: "transparent", color: "var(--color-text-primary)" },
};

export function Badge({ variant = "custom", icon, children, bg, color, style }: BadgeProps) {
  const v = variantMap[variant];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        fontSize: 11,
        fontWeight: 500,
        padding: "2px 7px",
        borderRadius: 20,
        background: bg ?? v.bg,
        color: color ?? v.color,
        whiteSpace: "nowrap",
        lineHeight: 1.4,
        ...style,
      }}
    >
      {(icon ?? v.icon) && (
        <i className={`ti ${icon ?? v.icon}`} style={{ fontSize: 10 }} />
      )}
      {children}
    </span>
  );
}
