"use client";

import React from "react";

export interface OdooStatusStep {
  id: string;
  label: string;
}

export interface OdooStatusbarProps {
  steps: OdooStatusStep[];
  currentStep: string;
  actions?: React.ReactNode;
  onStepClick?: (stepId: string) => void;
  className?: string;
}

export default function OdooStatusbar({
  steps,
  currentStep,
  actions,
  onStepClick,
  className = "",
}: OdooStatusbarProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div
      className={`odoo-statusbar flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-t-lg ${className}`}
      style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* Left: Document action buttons */}
      <div className="odoo-statusbar-actions flex items-center gap-2 flex-wrap">
        {actions}
      </div>

      {/* Right: Pipeline Steps */}
      <div className="odoo-statusbar-pipeline flex items-center gap-1 overflow-x-auto py-0.5">
        {steps.map((step, idx) => {
          const isActive = step.id === currentStep;
          const isPassed = currentIndex > -1 && idx < currentIndex;

          return (
            <div
              key={step.id}
              onClick={() => onStepClick && onStepClick(step.id)}
              className={`odoo-status-step inline-flex items-center text-xs font-semibold px-3 py-1 rounded transition-all ${
                onStepClick ? "cursor-pointer" : "cursor-default"
              }`}
              style={{
                background: isActive
                  ? "var(--accent)"
                  : isPassed
                  ? "var(--surface-2)"
                  : "transparent",
                color: isActive
                  ? "#FFFFFF"
                  : isPassed
                  ? "var(--text)"
                  : "var(--text-muted)",
                border: isActive
                  ? "1px solid var(--accent)"
                  : isPassed
                  ? "1px solid var(--border)"
                  : "1px dashed var(--border)",
              }}
            >
              {isPassed && (
                <span className="mr-1 text-green-600 font-bold" style={{ color: "var(--teal)" }}>
                  ✓
                </span>
              )}
              {step.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
