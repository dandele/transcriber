"use client";

import { useState } from "react";
import Link from "next/link";
import { Sidebar } from "../components/Sidebar";
import { Logo } from "../components/Logo";
import { useIsMobile } from "../lib/useIsMobile";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(28,25,21,0.35)",
            zIndex: 150, backdropFilter: "blur(2px)",
          }}
        />
      )}

      {/* Sidebar */}
      {(!isMobile || sidebarOpen) && (
        <Sidebar
          isMobile={isMobile}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Mobile top bar */}
        {isMobile && (
          <div style={{
            position: "sticky", top: 0, zIndex: 100,
            height: 56,
            background: "var(--color-bg-card)",
            borderBottom: "1px solid var(--color-border-subtle)",
            display: "flex", alignItems: "center",
            padding: "0 16px", gap: 12,
            boxShadow: "var(--shadow-sm)",
          }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: 6, borderRadius: "var(--radius-md)",
                color: "var(--color-text-1)", display: "flex", alignItems: "center",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
            <Link href="/dashboard" style={{ textDecoration: "none" }}>
              <Logo size="sm" />
            </Link>
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
