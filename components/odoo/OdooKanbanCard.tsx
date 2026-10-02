"use client";

import React from "react";
import Link from "next/link";

export interface OdooKanbanCardProps {
  id?: string | number;
  title: string;
  subtitle?: string;
  avatar?: string | React.ReactNode;
  initials?: string;
  badge?: {
    text: string;
    variant?: "success" | "warning" | "error" | "info" | "neutral";
  };
  metrics?: Array<{
    label: string;
    value: string | number;
  }>;
  href?: string;
  onClick?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

export default function OdooKanbanCard({
  title,
  subtitle,
  avatar,
  initials,
  badge,
  metrics,
  href,
  onClick,
  actions,
  className = "",
}: OdooKanbanCardProps) {
  const getBadgeStyle = (variant?: string) => {
    switch (variant) {
      case "success":
        return { background: "var(--green-100)", color: "var(--green-700)", border: "1px solid var(--green-200)" };
      case "warning":
        return { background: "var(--amber-bg)", color: "var(--amber)", border: "1px solid #fed7aa" };
      case "error":
        return { background: "var(--red-100)", color: "var(--red-700)", border: "1px solid var(--red-200)" };
      case "info":
        return { background: "var(--accent-bg)", color: "var(--accent-ink)", border: "1px solid #ddd6fe" };
      default:
        return { background: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" };
    }
  };

  const CardContent = (
    <div
      onClick={onClick}
      className={`odoo-kanban-card p-4 rounded-lg transition-all duration-150 relative flex flex-col justify-between ${
        href || onClick ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5" : ""
      } ${className}`}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shxs)",
      }}
    >
      <div>
        {/* Header row: Avatar + Title & Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar or Initials circle */}
            <div
              className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm"
              style={{
                background: "var(--accent-bg)",
                color: "var(--accent-ink)",
                border: "1px solid var(--border-soft)",
              }}
            >
              {avatar || initials || title.slice(0, 2).toUpperCase()}
            </div>

            <div className="min-w-0 flex flex-col">
              <span className="font-bold text-sm truncate" style={{ color: "var(--text)" }}>
                {title}
              </span>
              {subtitle && (
                <span className="text-xs truncate font-medium" style={{ color: "var(--text-muted)" }}>
                  {subtitle}
                </span>
              )}
            </div>
          </div>

          {/* Badge */}
          {badge && (
            <span
              className="px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap"
              style={getBadgeStyle(badge.variant)}
            >
              {badge.text}
            </span>
          )}
        </div>

        {/* Metrics Grid */}
        {metrics && metrics.length > 0 && (
          <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2" style={{ borderColor: "var(--border-soft)" }}>
            {metrics.map((m, idx) => (
              <div key={idx} className="flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--text-muted)" }}>
                  {m.label}
                </span>
                <span className="text-xs font-semibold" style={{ color: "var(--text)" }}>
                  {m.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Optional Card Bottom Actions */}
      {actions && (
        <div className="mt-3 pt-2 border-t flex items-center justify-end gap-2" style={{ borderColor: "var(--border-soft)" }}>
          {actions}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
        {CardContent}
      </Link>
    );
  }

  return CardContent;
}
