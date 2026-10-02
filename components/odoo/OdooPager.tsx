"use client";

import React, { useEffect } from "react";

export interface OdooPagerProps {
  current: number;
  total: number;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  label?: string;
  enableShortcuts?: boolean;
  className?: string;
}

export default function OdooPager({
  current,
  total,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  label,
  enableShortcuts = true,
  className = "",
}: OdooPagerProps) {
  const canGoPrev = hasPrev !== undefined ? hasPrev : current > 1;
  const canGoNext = hasNext !== undefined ? hasNext : current < total;

  useEffect(() => {
    if (!enableShortcuts) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === "ArrowLeft" && canGoPrev && onPrev) {
        e.preventDefault();
        onPrev();
      } else if (e.key === "ArrowRight" && canGoNext && onNext) {
        e.preventDefault();
        onNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enableShortcuts, canGoPrev, canGoNext, onPrev, onNext]);

  return (
    <div
      className={`odoo-pager inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${className}`}
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        userSelect: "none",
      }}
    >
      <span className="odoo-pager-counter text-muted-foreground whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
        {label || (total > 0 ? `${current} / ${total}` : "0 / 0")}
      </span>

      <div className="inline-flex items-center rounded overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        <button
          type="button"
          onClick={onPrev}
          disabled={!canGoPrev}
          title="Précédent (Flèche gauche)"
          aria-label="Élément précédent"
          className="odoo-pager-btn px-2 py-1 transition-colors hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            background: "var(--surface)",
            borderRight: "1px solid var(--border)",
            cursor: canGoPrev ? "pointer" : "not-allowed",
            color: "var(--text)",
            lineHeight: 1,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext}
          title="Suivant (Flèche droite)"
          aria-label="Élément suivant"
          className="odoo-pager-btn px-2 py-1 transition-colors hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            background: "var(--surface)",
            cursor: canGoNext ? "pointer" : "not-allowed",
            color: "var(--text)",
            lineHeight: 1,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
