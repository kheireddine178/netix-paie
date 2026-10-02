"use client";

import React from "react";
import Link from "next/link";
import OdooPager, { type OdooPagerProps } from "./OdooPager";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface OdooControlPanelProps {
  breadcrumbs: BreadcrumbItem[];
  title?: string;
  subtitle?: string;
  primaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
    icon?: React.ReactNode;
  };
  secondaryActions?: Array<{
    label: string;
    onClick?: () => void;
    href?: string;
    icon?: React.ReactNode;
  }>;
  search?: {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
  };
  filters?: Array<{
    id: string;
    label: string;
    active: boolean;
    onClick: () => void;
  }>;
  viewMode?: "kanban" | "list";
  onViewModeChange?: (mode: "kanban" | "list") => void;
  pager?: OdooPagerProps;
  extraRight?: React.ReactNode;
  className?: string;
}

export default function OdooControlPanel({
  breadcrumbs,
  title,
  subtitle,
  primaryAction,
  secondaryActions,
  search,
  filters,
  viewMode,
  onViewModeChange,
  pager,
  extraRight,
  className = "",
}: OdooControlPanelProps) {
  return (
    <div
      className={`odoo-control-panel flex flex-col gap-3 pb-4 mb-4 border-b ${className}`}
      style={{
        borderColor: "var(--border)",
      }}
    >
      {/* Row 1: Breadcrumbs & Pager / Status */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Breadcrumbs */}
        <nav aria-label="Fil d'ariane" className="flex items-center gap-2 text-sm font-semibold flex-wrap">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={idx}>
                {idx > 0 && (
                  <span className="text-gray-400 select-none" style={{ color: "var(--text-muted)" }}>
                    /
                  </span>
                )}
                {crumb.href && !isLast ? (
                  <Link
                    href={crumb.href}
                    className="hover:underline transition-colors"
                    style={{ color: "var(--accent)" }}
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span style={{ color: isLast ? "var(--text)" : "var(--text-muted)" }}>
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>

        {/* Right side of Row 1: Pager or Custom extra */}
        <div className="flex items-center gap-3 ml-auto">
          {extraRight}
          {pager && <OdooPager {...pager} />}
        </div>
      </div>

      {/* Row 2: Main Action Buttons & Search / Filters / View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Actions Bar (Left) */}
        <div className="flex items-center gap-2 flex-wrap">
          {primaryAction && (
            primaryAction.href ? (
              <Link
                href={primaryAction.href}
                className="btn btn-primary inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded shadow-sm"
              >
                {primaryAction.icon}
                <span>{primaryAction.label}</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={primaryAction.onClick}
                className="btn btn-primary inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded shadow-sm"
              >
                {primaryAction.icon}
                <span>{primaryAction.label}</span>
              </button>
            )
          )}

          {secondaryActions?.map((action, idx) => (
            action.href ? (
              <Link
                key={idx}
                href={action.href}
                className="btn btn-secondary inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded"
              >
                {action.icon}
                <span>{action.label}</span>
              </Link>
            ) : (
              <button
                key={idx}
                type="button"
                onClick={action.onClick}
                className="btn btn-secondary inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded"
              >
                {action.icon}
                <span>{action.label}</span>
              </button>
            )
          ))}
        </div>

        {/* Search, Filter chips, and View switchers (Right) */}
        <div className="flex items-center gap-2 flex-wrap sm:ml-auto">
          {/* Search Input */}
          {search && (
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <input
                type="text"
                value={search.value}
                onChange={(e) => search.onChange(e.target.value)}
                placeholder={search.placeholder || "Rechercher…"}
                className="w-full text-xs px-3 py-1.5 pl-8 rounded border transition-all"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border)",
                  color: "var(--text)",
                }}
              />
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--text-muted)" }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
          )}

          {/* Filter Chips */}
          {filters && filters.length > 0 && (
            <div className="flex items-center gap-1 overflow-x-auto py-1">
              {filters.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={f.onClick}
                  className={`text-[11px] font-semibold px-2 py-1 rounded transition-colors whitespace-nowrap cursor-pointer`}
                  style={{
                    background: f.active ? "var(--accent-bg)" : "var(--surface-2)",
                    color: f.active ? "var(--accent-ink)" : "var(--text-muted)",
                    border: f.active ? "1px solid var(--accent)" : "1px solid var(--border)",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {/* View Switcher (Kanban vs List) */}
          {onViewModeChange && viewMode && (
            <div
              className="inline-flex items-center rounded overflow-hidden p-0.5"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
              }}
            >
              {/* Kanban Button */}
              <button
                type="button"
                onClick={() => onViewModeChange("kanban")}
                title="Vue Kanban"
                aria-label="Afficher la vue Kanban"
                className={`p-1.5 rounded transition-colors ${
                  viewMode === "kanban" ? "shadow-xs" : "opacity-60 hover:opacity-100"
                }`}
                style={{
                  background: viewMode === "kanban" ? "var(--surface)" : "transparent",
                  color: viewMode === "kanban" ? "var(--accent)" : "var(--text-muted)",
                  border: viewMode === "kanban" ? "1px solid var(--border)" : "1px solid transparent",
                  cursor: "pointer",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="9" rx="1" />
                  <rect x="14" y="3" width="7" height="5" rx="1" />
                  <rect x="14" y="12" width="7" height="9" rx="1" />
                  <rect x="3" y="16" width="7" height="5" rx="1" />
                </svg>
              </button>

              {/* List Button */}
              <button
                type="button"
                onClick={() => onViewModeChange("list")}
                title="Vue Liste"
                aria-label="Afficher la vue Liste"
                className={`p-1.5 rounded transition-colors ${
                  viewMode === "list" ? "shadow-xs" : "opacity-60 hover:opacity-100"
                }`}
                style={{
                  background: viewMode === "list" ? "var(--surface)" : "transparent",
                  color: viewMode === "list" ? "var(--accent)" : "var(--text-muted)",
                  border: viewMode === "list" ? "1px solid var(--border)" : "1px solid transparent",
                  cursor: "pointer",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
