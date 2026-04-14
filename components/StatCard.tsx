import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({ label, value, subtitle, color, icon, className }: StatCardProps) {
  return (
    <div className={cn("card p-4 flex flex-col gap-1", className)}>
      <div className="flex items-center justify-between">
        <span className="section-title">{label}</span>
        {icon && <span className="text-[var(--text-muted)]">{icon}</span>}
      </div>
      <div className="flex items-end gap-1.5 mt-1">
        <span
          className="text-3xl font-bold leading-none"
          style={color ? { color } : undefined}
        >
          {value}
        </span>
        {subtitle && (
          <span className="text-xs text-[var(--text-muted)] pb-0.5 font-medium">{subtitle}</span>
        )}
      </div>
    </div>
  );
}
