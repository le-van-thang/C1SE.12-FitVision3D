import React from "react";

export interface GlassCardProps {
  children: React.ReactNode;
  accent?: "cyan" | "violet" | "none";
  padding?: "none" | "sm" | "md" | "lg";
  interactive?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  as?: keyof JSX.IntrinsicElements;
}

const PADDING_MAP = { none: "0", sm: "var(--sp-3)", md: "var(--sp-5)", lg: "var(--sp-6)" };

export const GlassCard: React.FC<GlassCardProps> = ({
  children, accent = "none", padding = "md", interactive = false,
  onClick, className = "", style, id, as: Tag = "div",
}) => {
  const cls = [
    "glass-card",
    accent === "cyan"   ? "glass-card--cyan"   : "",
    accent === "violet" ? "glass-card--violet"  : "",
    (interactive || onClick) ? "glass-card--interactive" : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <Tag
      id={id}
      className={cls}
      style={{ padding: PADDING_MAP[padding], ...style }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </Tag>
  );
};

export default GlassCard;
