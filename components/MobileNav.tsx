"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckSquare, BarChart3, Settings, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Habits", icon: CheckSquare },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/habits/new", label: "Add", icon: Plus, special: true },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--header-bg)] backdrop-blur-lg">
      <div className="flex items-center justify-around px-2 py-1 safe-area-inset-bottom">
        {navItems.map(({ href, label, icon: Icon, special }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all duration-150",
                special
                  ? "text-white"
                  : isActive
                  ? "text-emerald-500"
                  : "text-[var(--text-muted)]"
              )}
            >
              {special ? (
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 -mt-4">
                  <Icon size={20} className="text-white" strokeWidth={2.5} />
                </div>
              ) : (
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              )}
              <span className={cn("text-[10px] font-medium", special && "text-[var(--text-muted)] mt-1")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
