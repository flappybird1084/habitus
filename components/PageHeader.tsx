"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, backHref, actions, className }: PageHeaderProps) {
  const router = useRouter();

  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-[var(--header-bg)] border-b border-[var(--border)] backdrop-blur-lg",
        className
      )}
    >
      <div className="flex items-center gap-3 px-4 py-4 max-w-3xl mx-auto">
        {backHref && (
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[var(--card-hover)] transition-colors shrink-0"
          >
            <ArrowLeft size={18} className="text-[var(--text-secondary)]" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-lg text-[var(--text-primary)] leading-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </header>
  );
}
