"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { ProfileDropdown } from "./ProfileDropdown";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <rect x="1.5" y="1.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
        <rect x="8.5" y="1.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
        <rect x="1.5" y="8.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
        <rect x="8.5" y="8.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
      </svg>
    ),
  },
  {
    href: "/upload",
    label: "Nuova trascrizione",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <path d="M7.5 10V2m0 0L4.5 5m3-3L10.5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 11v1a1 1 0 001 1h9a1 1 0 001-1v-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/history",
    label: "Storico",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <circle cx="7.5" cy="7.5" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M7.5 4.5V7.5l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

type SidebarProps = {
  isMobile?: boolean;
  onClose?: () => void;
};

export function Sidebar({ isMobile = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside style={{
      width: 220, minWidth: 220,
      height: "100vh",
      background: "var(--color-bg-card)",
      borderRight: "1px solid var(--color-border)",
      display: "flex", flexDirection: "column",
      padding: "24px 0",
      // Mobile: fixed drawer
      ...(isMobile ? {
        position: "fixed", left: 0, top: 0, zIndex: 200,
        boxShadow: "var(--shadow-lg)",
      } : {
        position: "sticky", top: 0, alignSelf: "flex-start",
      }),
    }}>
      {/* Logo row + close button on mobile */}
      <div style={{ padding: "0 20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/dashboard" style={{ textDecoration: "none" }} onClick={onClose}>
          <Logo size="md" />
        </Link>
        {isMobile && (
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--color-text-3)", fontSize: 22, lineHeight: 1, padding: "2px 4px",
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Section label */}
      <div style={{ padding: "0 20px 8px" }}>
        <span style={{
          fontSize: 11, fontWeight: 600,
          color: "var(--color-text-3)",
          letterSpacing: "0.08em", textTransform: "uppercase",
        }}>
          Menu
        </span>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: "0 12px", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 10px", borderRadius: "var(--radius-md)",
                background: isActive ? "var(--color-accent-light)" : "transparent",
                color: isActive ? "var(--color-accent-text)" : "var(--color-text-2)",
                fontSize: 13.5, fontWeight: isActive ? 500 : 400,
                textDecoration: "none",
                transition: "all 0.12s ease",
              }}
            >
              <span style={{ opacity: 0.85, flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Profile */}
      <div style={{ padding: "12px", borderTop: "1px solid var(--color-border-subtle)" }}>
        <ProfileDropdown direction="up" />
      </div>
    </aside>
  );
}
