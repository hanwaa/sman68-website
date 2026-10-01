"use client";

import { motion } from "framer-motion";
import { ChevronRight, LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { icon: React.ElementType; label: string; id: string };

type Props = {
  open: boolean;
  isMobile: boolean;
  navItems: NavItem[];
  activePage: string;
  displayName: string;
  subtitle: string;
  initialsSource: string;
  onNavigate: (page: string) => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  onCloseMobile: () => void;
};

export default function DashboardSidebar({
  open,
  isMobile,
  navItems,
  activePage,
  displayName,
  subtitle,
  initialsSource,
  onNavigate,
  onOpenSettings,
  onLogout,
  onCloseMobile,
}: Props) {
  return (
    <>
      <motion.aside
        initial={false}
        animate={{ transform: open ? "translateX(0)" : "translateX(-100%)" }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        inert={!open}
        className="fixed left-0 top-16 bottom-0 w-[240px] bg-white border-r border-line z-40 overflow-hidden flex-shrink-0 shadow-sm"
        aria-label="Sidebar navigasi"
      >
        <div className="w-[240px] flex flex-col h-full">
          <div className="p-4 border-b border-line bg-cream/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-pine text-brand-leaf flex items-center justify-center font-display font-extrabold text-sm flex-shrink-0 shadow-sm">
                {initialsSource.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-ink text-sm truncate">{displayName}</div>
                <div className="text-[11px] text-muted truncate mt-0.5">{subtitle}</div>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Menu dashboard">
            <div className="text-[10px] font-bold text-muted uppercase tracking-wider px-3 mb-2">
              Menu Utama
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isCurrent = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-200 ease-out",
                    isCurrent
                      ? "bg-brand-pine text-white"
                      : "text-ink/70 hover:bg-cream hover:text-ink"
                  )}
                  aria-current={isCurrent ? "page" : undefined}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} className={isCurrent ? "text-brand-leaf" : "text-muted"} />
                    <span>{item.label}</span>
                  </div>
                  {isCurrent && <ChevronRight size={14} className="text-white/60" />}
                </button>
              );
            })}
          </nav>

          <div className="p-3 border-t border-line space-y-1 bg-cream/40">
            <button
              onClick={onOpenSettings}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-muted hover:bg-white hover:text-ink transition-colors duration-200 ease-out"
            >
              <Settings size={15} />
              Pengaturan Akun
            </button>
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-muted hover:bg-cream hover:text-ink transition-colors duration-200 ease-out text-left"
            >
              <LogOut size={15} />
              Keluar Akun
            </button>
          </div>
        </div>
      </motion.aside>

      {isMobile && (
        <div
          className={cn(
            "fixed inset-0 top-16 z-30 bg-brand-pine/50 backdrop-blur-[1px] transition-opacity duration-200 ease-[var(--ease-out)]",
            open ? "opacity-100" : "pointer-events-none opacity-0"
          )}
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}
    </>
  );
}
