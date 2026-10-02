"use client";

import React, { useState } from "react";

export interface OdooTab {
  id: string;
  label: string;
  count?: number;
  badge?: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

export interface OdooNotebookProps {
  tabs: OdooTab[];
  defaultTab?: string;
  className?: string;
  onTabChange?: (tabId: string) => void;
}

export default function OdooNotebook({
  tabs,
  defaultTab,
  className = "",
  onTabChange,
}: OdooNotebookProps) {
  const [activeTab, setActiveTab] = useState<string>(defaultTab || tabs[0]?.id || "");

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    if (onTabChange) onTabChange(id);
  };

  const currentTabObj = tabs.find((t) => t.id === activeTab) || tabs[0];

  return (
    <div className={`odoo-notebook w-full ${className}`}>
      {/* Tabs navigation header */}
      <div
        className="odoo-notebook-tabs flex items-center gap-1 overflow-x-auto border-b"
        style={{ borderColor: "var(--border)" }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabClick(tab.id)}
              className={`odoo-tab-btn inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all whitespace-nowrap -mb-px border-b-2`}
              style={{
                borderColor: isActive ? "var(--accent)" : "transparent",
                color: isActive ? "var(--accent)" : "var(--text-muted)",
                background: isActive ? "var(--surface)" : "transparent",
                cursor: "pointer",
              }}
            >
              {tab.icon && <span>{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className="px-1.5 py-0.2 rounded-full text-xs font-bold"
                  style={{
                    background: isActive ? "var(--accent-bg)" : "var(--surface-2)",
                    color: isActive ? "var(--accent-ink)" : "var(--text-muted)",
                  }}
                >
                  {tab.count}
                </span>
              )}
              {tab.badge && (
                <span
                  className="px-1.5 py-0.5 rounded text-[11px] font-bold"
                  style={{ background: "var(--teal-bg)", color: "var(--teal-ink)" }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Tab Content Panel */}
      <div className="odoo-notebook-content py-4">
        {currentTabObj?.content}
      </div>
    </div>
  );
}
