import type { CSSProperties, ReactNode, MouseEvent } from "react";

// ── Badge ────────────────────────────────────────────────────────────────────

type BadgeVariant = "default" | "success" | "accent" | "warning";

const BADGE_STYLES: Record<BadgeVariant, CSSProperties> = {
  default: { background: "var(--color-bg-subtle)",    color: "var(--color-text-2)" },
  success: { background: "var(--color-success-light)", color: "var(--color-success)" },
  accent:  { background: "var(--color-accent-light)",  color: "var(--color-accent-text)" },
  warning: { background: "var(--color-warning-light)", color: "var(--color-warning)" },
};

export function Badge({ children, variant = "default" }: { children: ReactNode; variant?: BadgeVariant }) {
  return (
    <span style={{
      ...BADGE_STYLES[variant],
      padding: "2px 8px", borderRadius: "var(--radius-full)",
      fontSize: 12, fontWeight: 500,
    }}>
      {children}
    </span>
  );
}

// ── Button ───────────────────────────────────────────────────────────────────

type BtnVariant = "primary" | "secondary" | "ghost" | "danger";
type BtnSize = "sm" | "md" | "lg";

const BTN_VARIANTS: Record<BtnVariant, CSSProperties> = {
  primary:   { background: "var(--color-accent)",    color: "#fff",                    borderColor: "var(--color-accent)" },
  secondary: { background: "var(--color-bg-subtle)", color: "var(--color-text-1)",     borderColor: "var(--color-border)" },
  ghost:     { background: "transparent",            color: "var(--color-text-2)",     borderColor: "transparent" },
  danger:    { background: "transparent",            color: "var(--color-danger)",     borderColor: "var(--color-danger-light)" },
};

const BTN_SIZES: Record<BtnSize, CSSProperties> = {
  sm: { padding: "6px 12px",  fontSize: 13 },
  md: { padding: "10px 18px", fontSize: 14 },
  lg: { padding: "13px 24px", fontSize: 15 },
};

export function Btn({
  children, onClick, variant = "primary", size = "md",
  fullWidth = false, disabled = false, type = "button",
}: {
  children: ReactNode;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  variant?: BtnVariant;
  size?: BtnSize;
  fullWidth?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
        fontWeight: 500, borderRadius: "var(--radius-md)", border: "1px solid transparent",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.15s ease",
        width: fullWidth ? "100%" : undefined,
        fontFamily: "inherit",
        ...BTN_SIZES[size],
        ...BTN_VARIANTS[variant],
      }}
    >
      {children}
    </button>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────

export function Card({
  children, style, onClick, hover = false,
}: {
  children: ReactNode;
  style?: CSSProperties;
  onClick?: () => void;
  hover?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: "var(--radius-lg)",
        padding: 24,
        boxShadow: "var(--shadow-sm)",
        transition: hover ? "all 0.15s ease" : undefined,
        cursor: onClick ? "pointer" : undefined,
        ...style,
      }}
      onMouseEnter={hover ? (e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-md)";
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-border)";
      } : undefined}
      onMouseLeave={hover ? (e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-sm)";
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-border-subtle)";
      } : undefined}
    >
      {children}
    </div>
  );
}
