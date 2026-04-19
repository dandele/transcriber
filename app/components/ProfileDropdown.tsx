"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";

export function ProfileDropdown({ direction = "up" }: { direction?: "up" | "down" }) {
  const [open, setOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email ?? "");
        setUserName(user.user_metadata?.name ?? user.email?.split("@")[0] ?? "Utente");
      }
    });
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const initial = userName.charAt(0).toUpperCase() || "U";

  const menuStyle: React.CSSProperties = {
    position: "absolute",
    left: 0, right: 0,
    ...(direction === "up" ? { bottom: "calc(100% + 8px)" } : { top: "calc(100% + 8px)" }),
    background: "var(--color-bg-card)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-lg)",
    boxShadow: "var(--shadow-lg)",
    padding: 6,
    zIndex: 200,
    minWidth: 180,
  };

  const menuItem = (label: string, icon: React.ReactNode, danger = false, onClick?: () => void) => (
    <button
      key={label}
      onClick={() => { setOpen(false); onClick?.(); }}
      style={{
        display: "flex", alignItems: "center", gap: 8, width: "100%",
        padding: "8px 10px", border: "none", borderRadius: "var(--radius-md)",
        background: "none", cursor: "pointer", fontFamily: "inherit",
        fontSize: 13, color: danger ? "var(--color-danger)" : "var(--color-text-1)",
        textAlign: "left", transition: "background 0.12s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-subtle)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          width: "100%", padding: "10px 8px",
          background: open ? "var(--color-bg-subtle)" : "none",
          border: "none", borderRadius: "var(--radius-md)",
          cursor: "pointer", fontFamily: "inherit",
          transition: "background 0.12s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-subtle)")}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = "none"; }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
          background: "var(--color-accent-light)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 600, color: "var(--color-accent-text)",
        }}>
          {initial}
        </div>
        <div style={{ textAlign: "left", minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {userName}
          </div>
          <div style={{ fontSize: 11, color: "var(--color-text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {userEmail}
          </div>
        </div>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, color: "var(--color-text-3)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
          <path d={direction === "up" ? "M2 8l4-4 4 4" : "M2 4l4 4 4-4"} stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div style={menuStyle}>
          <div style={{ padding: "8px 10px 10px", borderBottom: "1px solid var(--color-border-subtle)", marginBottom: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-1)" }}>{userName}</div>
            <div style={{ fontSize: 11, color: "var(--color-text-3)", marginTop: 2 }}>{userEmail}</div>
          </div>

          {menuItem("Profilo", (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M1.5 13c0-3.038 2.462-5.5 5.5-5.5s5.5 2.462 5.5 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          ), false, () => router.push("/profile"))}

          {menuItem("Impostazioni", (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.636 2.636l1.06 1.06M10.303 10.303l1.061 1.061M2.636 11.364l1.06-1.06M10.303 3.697l1.061-1.061" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          ))}

          <div style={{ borderTop: "1px solid var(--color-border-subtle)", marginTop: 6, paddingTop: 6 }}>
            {menuItem("Disconnetti", (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5.5 7H12M9.5 4.5L12 7l-2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 2H3a1 1 0 00-1 1v8a1 1 0 001 1h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            ), true, handleSignOut)}
          </div>
        </div>
      )}
    </div>
  );
}
