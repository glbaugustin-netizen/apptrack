import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  accent?: string;
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { accent = "#7F77DD", label, style, onFocus, onBlur, ...props },
  ref
) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {label && (
        <label
          style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)" }}
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        style={{
          width: "100%",
          height: 36,
          padding: "8px 10px",
          border: "0.5px solid var(--color-border-secondary)",
          borderRadius: "var(--border-radius-md)",
          fontSize: 13,
          background: "var(--color-background-primary)",
          color: "var(--color-text-primary)",
          outline: "none",
          transition: "border-color 0.15s, box-shadow 0.15s",
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = accent;
          e.currentTarget.style.boxShadow = `0 0 0 2px ${accent}33`;
          onFocus?.(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--color-border-secondary)";
          e.currentTarget.style.boxShadow = "none";
          onBlur?.(e);
        }}
        {...props}
      />
    </div>
  );
});
