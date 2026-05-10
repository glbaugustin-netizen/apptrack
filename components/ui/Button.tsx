import { CSSProperties, ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  accent?: string;
  icon?: string;
  size?: "sm" | "md" | "lg";
}

const variantStyles: Record<Variant, CSSProperties> = {
  primary: {
    background: "var(--accent, #7F77DD)",
    color: "#fff",
    border: "none",
  },
  secondary: {
    background: "transparent",
    color: "var(--color-text-secondary)",
    border: "0.5px solid var(--color-border-secondary)",
  },
  danger: {
    background: "#E24B4A",
    color: "#fff",
    border: "none",
  },
};

const sizeStyles: Record<"sm" | "md" | "lg", CSSProperties> = {
  sm: { padding: "4px 10px", fontSize: 11 },
  md: { padding: "6px 12px", fontSize: 13 },
  lg: { padding: "10px 20px", fontSize: 13 },
};

export function Button({
  variant = "primary",
  accent,
  icon,
  size = "md",
  children,
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        borderRadius: "var(--border-radius-md)",
        fontWeight: 500,
        cursor: "pointer",
        lineHeight: 1,
        transition: "opacity 0.15s",
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...(accent && variant === "primary" ? { background: accent } : {}),
        ...style,
      }}
      onMouseDown={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.98)";
        props.onMouseDown?.(e);
      }}
      onMouseUp={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
        props.onMouseUp?.(e);
      }}
      {...props}
    >
      {icon && <i className={`ti ${icon}`} style={{ fontSize: size === "lg" ? 16 : 14 }} />}
      {children}
    </button>
  );
}
