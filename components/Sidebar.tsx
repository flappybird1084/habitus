"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CheckSquare,
  BarChart3,
  Settings,
  Plus,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Habits", icon: CheckSquare },
  { href: "/stats", label: "Statistics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 h-full border-r border-[var(--border)] bg-[var(--sidebar-bg)] shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="font-bold text-[var(--text-primary)] text-base leading-tight">
              Habitus
            </h1>
            <p className="text-xs text-[var(--text-muted)]">Build better habits</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "text-[var(--text-secondary)] hover:bg-[var(--card-hover)] hover:text-[var(--text-primary)]"
              )}
            >
              <Icon
                className={cn(
                  "w-4.5 h-4.5 shrink-0",
                  isActive ? "text-emerald-500" : "text-[var(--text-muted)]"
                )}
                size={18}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Add habit button */}
      <div className="p-4 border-t border-[var(--border)]">
        <Link
          href="/habits/new"
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-all duration-150 shadow-lg shadow-emerald-500/25 active:scale-95"
        >
          <Plus size={16} strokeWidth={2.5} />
          New Habit
        </Link>
      </div>
    </aside>
  );
}
