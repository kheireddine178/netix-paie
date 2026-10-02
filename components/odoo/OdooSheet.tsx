"use client";

import React from "react";

export interface OdooSmartButton {
  id: string;
  icon?: React.ReactNode;
  label: string;
  count: number | string;
  onClick?: () => void;
  href?: string;
}

export interface OdooSheetProps {
  statusbar?: React.ReactNode;
  smartButtons?: OdooSmartButton[];
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  avatar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export default function OdooSheet({
  statusbar,
  smartButtons,
  title,
  subtitle,
  avatar,
  children,
  className = "",
}: OdooSheetProps) {
  return (
    <div className={`odoo-sheet-wrapper w-full max-w-6xl mx-auto ${className}`}>
      {/* 1. Statusbar on top of the sheet */}
      {statusbar}

      {/* 2. Main Sheet Body (Paper style) */}
      <div
        className="odoo-sheet rounded-b-lg p-6 sm:p-8"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderTop: statusbar ? "none" : "1px solid var(--border)",
          boxShadow: "var(--shsm)",
        }}
      >
        {/* Top Section : Avatar + Title + Smart Buttons */}
        {(title || (smartButtons && smartButtons.length > 0)) && (
          <div className="odoo-sheet-header flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 mb-6 border-b" style={{ borderColor: "var(--border-soft)" }}>
            
            {/* Left: Avatar + Title & Subtitle */}
            <div className="flex items-start gap-4">
              {avatar && (
                <div className="odoo-sheet-avatar flex-shrink-0">
                  {avatar}
                </div>
              )}
              <div className="flex flex-col">
                {title && (
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight m-0" style={{ color: "var(--text)" }}>
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <div className="text-sm font-medium mt-1" style={{ color: "var(--text-muted)" }}>
                    {subtitle}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Smart Buttons (Stat Boxes) */}
            {smartButtons && smartButtons.length > 0 && (
              <div className="odoo-smart-buttons flex items-center gap-2 flex-wrap self-start">
                {smartButtons.map((btn) => {
                  const content = (
                    <div
                      key={btn.id}
                      onClick={btn.onClick}
                      className="odoo-smart-button flex items-center gap-3 px-3 py-2 rounded-md transition-all hover:bg-slate-50 cursor-pointer"
                      style={{
                        border: "1px solid var(--border)",
                        background: "var(--surface-2)",
                      }}
                    >
                      {btn.icon && (
                        <div className="text-lg" style={{ color: "var(--accent)" }}>
                          {btn.icon}
                        </div>
                      )}
                      <div className="flex flex-col leading-tight">
                        <span className="text-sm font-bold" style={{ color: "var(--text)" }}>
                          {btn.count}
                        </span>
                        <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
                          {btn.label}
                        </span>
                      </div>
                    </div>
                  );

                  return btn.href ? (
                    <a key={btn.id} href={btn.href} style={{ textDecoration: "none" }}>
                      {content}
                    </a>
                  ) : content;
                })}
              </div>
            )}
          </div>
        )}

        {/* 3. Main Sheet Content */}
        <div className="odoo-sheet-body">
          {children}
        </div>
      </div>
    </div>
  );
}
