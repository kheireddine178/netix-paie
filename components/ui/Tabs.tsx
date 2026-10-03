import React from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  badge?: number | string;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: "underline" | "pills";
  className?: string;
}

/**
 * Tabs — Système d'onglets épuré Netix SIRH
 * Règle §3.2 : Indicateur indigo pour l'onglet actif, badges discrets.
 */
export function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = "underline",
  className,
}: TabsProps) {
  if (variant === "pills") {
    return (
      <div
        role="tablist"
        className={cn(
          "inline-flex p-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg gap-1",
          className
        )}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all select-none cursor-pointer",
                isActive
                  ? "bg-white text-[#0F172A] shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
                  : "text-[#64748B] hover:text-[#0F172A]"
              )}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full tabular-nums font-bold",
                    isActive ? "bg-[#EEF2FF] text-[#4F46E5]" : "bg-[#E2E8F0] text-[#64748B]"
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Underline style (par défaut)
  return (
    <div
      role="tablist"
      className={cn("flex border-b border-[#E2E8F0] gap-6 overflow-x-auto", className)}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "inline-flex items-center gap-2 pb-3 pt-1 text-sm font-medium border-b-2 transition-all relative select-none whitespace-nowrap cursor-pointer",
              isActive
                ? "border-[#4F46E5] text-[#4F46E5] font-semibold"
                : "border-transparent text-[#64748B] hover:text-[#0F172A] hover:border-[#CBD5E1]"
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  "text-[11px] px-2 py-0.5 rounded-full tabular-nums font-semibold",
                  isActive ? "bg-[#EEF2FF] text-[#4F46E5]" : "bg-[#F1F5F9] text-[#64748B]"
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
