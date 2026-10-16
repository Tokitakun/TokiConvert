"use client";

import React from "react";

interface RetroProgressBarProps {
  value?: number; // 0 to 100, or undefined for indeterminate
  totalBlocks?: number;
  variant?: "terracotta" | "green" | "gold";
  showPercentage?: boolean;
  label?: string;
  className?: string;
}

export default function RetroProgressBar({
  value,
  totalBlocks = 16,
  variant = "terracotta",
  showPercentage = true,
  label,
  className = "",
}: RetroProgressBarProps) {
  const isIndeterminate = value === undefined || isNaN(value);
  const clampedValue = Math.max(0, Math.min(100, value || 0));
  const filledBlocks = Math.round((clampedValue / 100) * totalBlocks);

  const colorStyles = {
    terracotta: {
      filled: "bg-[#A34F38] border-[#8B3F2A]",
      empty: "bg-[#D8CCB9]/40 border-[#D8CCB9]/60",
      accent: "text-[#A34F38]",
    },
    green: {
      filled: "bg-[#344638] border-[#253328]",
      empty: "bg-[#D8CCB9]/40 border-[#D8CCB9]/60",
      accent: "text-[#344638]",
    },
    gold: {
      filled: "bg-[#D4B98A] border-[#B89B65]",
      empty: "bg-[#D8CCB9]/40 border-[#D8CCB9]/60",
      accent: "text-[#8A6D3B]",
    },
  }[variant];

  return (
    <div
      className={`flex flex-col gap-1.5 w-full ${className}`}
      role="progressbar"
      aria-valuenow={isIndeterminate ? undefined : clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || "Proses konversi"}
    >
      {(label || (!isIndeterminate && showPercentage)) && (
        <div className="flex items-center justify-between text-[11px] font-mono tracking-tight text-[#62584C]">
          <span className="truncate">{label || "PROSES"}</span>
          {!isIndeterminate && showPercentage && (
            <span className={`font-bold ${colorStyles.accent}`}>
              {clampedValue}%
            </span>
          )}
          {isIndeterminate && (
            <span className="italic text-[10px] text-[#62584C]/80 animate-pulse">
              MEMPROSES...
            </span>
          )}
        </div>
      )}

      {/* Retro 90s Block Grid Bar */}
      <div className="flex items-center gap-[3px] p-1 bg-[#F4EBDD] border border-[#D8CCB9] rounded shadow-inner">
        {Array.from({ length: totalBlocks }).map((_, i) => {
          let isFilled = false;
          if (isIndeterminate) {
            // Indeterminate animation marquee via pure CSS staggered delays
            return (
              <div
                key={i}
                className={`h-2.5 flex-1 rounded-[1px] border transition-colors ${colorStyles.filled} opacity-30 animate-pulse`}
                style={{
                  animationDelay: `${(i * 120) % 1200}ms`,
                  animationDuration: "1.2s",
                }}
              />
            );
          } else {
            isFilled = i < filledBlocks;
            return (
              <div
                key={i}
                className={`h-2.5 flex-1 rounded-[1px] border transition-all duration-150 ${
                  isFilled ? colorStyles.filled : colorStyles.empty
                }`}
              />
            );
          }
        })}
      </div>
    </div>
  );
}
