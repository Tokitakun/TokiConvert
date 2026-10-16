"use client";

import React from "react";

interface PixelLoaderProps {
  size?: number;
  className?: string;
  color?: string;
}

export default function PixelLoader({
  size = 20,
  className = "",
  color = "#A34F38",
}: PixelLoaderProps) {
  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 motion-safe:animate-[spin_2s_steps(4)_infinite] ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* 90s Pixelated Retro Hourglass (SVG grid of square pixel blocks) */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill={color}
        xmlns="http://www.w3.org/2000/svg"
        shapeRendering="crispEdges"
      >
        {/* Top & bottom bars */}
        <rect x="2" y="1" width="12" height="2" />
        <rect x="2" y="13" width="12" height="2" />
        {/* Top chamber sloping */}
        <rect x="3" y="3" width="10" height="2" opacity="0.9" />
        <rect x="5" y="5" width="6" height="2" opacity="0.9" />
        {/* Center neck */}
        <rect x="7" y="7" width="2" height="2" />
        {/* Bottom chamber sloping */}
        <rect x="5" y="9" width="6" height="2" opacity="0.9" />
        <rect x="3" y="11" width="10" height="2" opacity="0.9" />
      </svg>
    </div>
  );
}
