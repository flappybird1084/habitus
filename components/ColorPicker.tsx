"use client";

import { Check } from "lucide-react";
import { PALETTE_COLORS } from "@/lib/models";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  value: number;
  onChange: (index: number) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {PALETTE_COLORS.map((color, index) => (
        <button
          key={index}
          onClick={() => onChange(index)}
          className={cn(
            "w-8 h-8 rounded-full transition-all duration-150 active:scale-90 flex items-center justify-center",
            value === index ? "ring-2 ring-offset-2 ring-[var(--text-primary)]" : "hover:scale-110"
          )}
          style={{ backgroundColor: color }}
          title={`Color ${index}`}
        >
          {value === index && (
            <Check size={14} className="text-white" strokeWidth={3} />
          )}
        </button>
      ))}
    </div>
  );
}
