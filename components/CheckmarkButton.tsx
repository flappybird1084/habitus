"use client";

import { Check, X, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import { getColor } from "@/lib/models";

interface CheckmarkButtonProps {
  completed: boolean;
  color: number;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  type?: "YES_NO" | "NUMERICAL";
  value?: number;
  dark?: boolean;
}

export function CheckmarkButton({
  completed,
  color,
  size = "md",
  onClick,
  type = "YES_NO",
  value,
  dark = false,
}: CheckmarkButtonProps) {
  const hexColor = getColor(color, dark);

  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-11 h-11 text-base",
    lg: "w-14 h-14 text-lg",
  };

  const iconSizes = { sm: 14, md: 18, lg: 22 };

  return (
    <button
      onClick={onClick}
      style={
        completed
          ? { backgroundColor: hexColor, borderColor: hexColor }
          : { borderColor: hexColor + "60" }
      }
      className={cn(
        "rounded-full border-2 flex items-center justify-center transition-all duration-200 active:scale-90 shrink-0",
        sizeClasses[size],
        completed
          ? "shadow-md"
          : "bg-transparent hover:opacity-80"
      )}
    >
      {completed ? (
        type === "NUMERICAL" && value !== undefined ? (
          <span
            className="font-bold text-white leading-none"
            style={{ fontSize: iconSizes[size] - 4 }}
          >
            {value}
          </span>
        ) : (
          <Check
            size={iconSizes[size]}
            className="text-white"
            strokeWidth={3}
          />
        )
      ) : (
        <div
          style={{
            width: iconSizes[size] - 6,
            height: iconSizes[size] - 6,
            borderRadius: 2,
            backgroundColor: hexColor,
            opacity: 0.3,
          }}
        />
      )}
    </button>
  );
}
