"use client";

import React from "react";

interface TerminalStatusProps {
  logs: string[];
  currentAction?: string;
  className?: string;
  variant?: "dark" | "paper";
}

export default function TerminalStatus({
  logs,
  currentAction,
  className = "",
  variant = "paper",
}: TerminalStatusProps) {
  const isDark = variant === "dark";

  return (
    <div
      className={`rounded border font-mono text-[11px] p-3 leading-relaxed transition-all ${
        isDark
          ? "bg-[#25221E] border-[#443E37] text-[#D4B98A]"
          : "bg-[#F4EBDD]/80 border-[#D8CCB9] text-[#332F29]"
      } ${className}`}
      aria-live="polite"
      role="status"
    >
      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#D8CCB9]/40 text-[10px] text-[#62584C] uppercase tracking-wider font-semibold">
        <span>STATUS TERMINAL</span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#344638] animate-ping" />
          <span>AKTIF</span>
        </span>
      </div>

      <div className="space-y-1 max-h-24 overflow-y-auto">
        {logs.map((log, i) => (
          <div key={i} className="flex items-start gap-1.5">
            <span className="text-[#A34F38] font-bold select-none">&gt;</span>
            <span className="truncate">{log}</span>
          </div>
        ))}
        {currentAction && (
          <div className="flex items-center gap-1.5 font-bold text-[#A34F38]">
            <span className="select-none">&gt;</span>
            <span className="truncate">{currentAction}</span>
            <span className="inline-block w-1.5 h-3 bg-[#A34F38] animate-pulse ml-0.5" />
          </div>
        )}
      </div>
    </div>
  );
}
