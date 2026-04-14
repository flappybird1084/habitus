"use client";

import { getColor } from "@/lib/models";

interface ScoreRingProps {
  score: number; // 0-1
  color: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  dark?: boolean;
}

export function ScoreRing({
  score,
  color,
  size = 64,
  strokeWidth = 5,
  showLabel = true,
  dark = false,
}: ScoreRingProps) {
  const hexColor = getColor(color, dark);
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - score * circumference;
  const center = size / 2;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Background ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={hexColor}
          strokeWidth={strokeWidth}
          opacity={0.15}
        />
        {/* Progress ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={hexColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base font-bold text-[var(--text-primary)] leading-none">
            {Math.round(score * 100)}
          </span>
          <span className="text-[9px] text-[var(--text-muted)] mt-0.5 font-medium">score</span>
        </div>
      )}
    </div>
  );
}
