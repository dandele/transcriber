"use client";

import { useState } from "react";
import { Btn } from "../../components/ui";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px",
  border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)",
  fontSize: 14, color: "var(--color-text-1)",
  background: "var(--color-bg-card)", outline: "none",
  fontFamily: "inherit", boxSizing: "border-box",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--color-bg-card)", border: "1px solid var(--color-border-subtle)",
      borderRadius: "var(--radius-lg)", padding: 24, boxShadow: "var(--shadow-sm)",
    }}>
      <h2 style={{
        fontFamily: "var(--font-dm-serif), 'DM Serif Display', serif",
        fontSize: 18, fontWeight: 400, color: "var(--color-text-1)", margin: "0 0 20px",
      }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--color-text-2)", marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export default function ProfilePage() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
      {/* Header */}
      <header style={{
        padding: "0 40px", height: 64,
        display: "flex", alignItems: "center",
        borderBottom: "1px solid var(--color-border-subtle)",
        background: "var(--color-bg-card)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <h1 style={{
          fontFamily: "var(--font-dm-serif), 'DM Serif Display', serif",
          fontSize: 22, fontWeight: 400, color: "var(--color-text-1)", margin: 0,
        }}>
          Profilo
        </h1>
      </header>

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "36px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Avatar */}
        <Section title="Informazioni personali">
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 24 }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "var(--color-accent-light)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24, fontWeight: 600, color: "var(--color-accent-text)", flexShrink: 0,
            }}>
              D
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-1)", marginBottom: 4 }}>Daniele D&apos;Amico</p>
              <p style={{ fontSize: 13, color: "var(--color-text-3)", margin: 0 }}>info@paradygma.tech</p>
            </div>
          </div>

          <Field label="Nome completo">
            <input style={inputStyle} defaultValue="Daniele D'Amico" />
          </Field>
          <Field label="Email">
            <input style={inputStyle} type="email" defaultValue="info@paradygma.tech" />
          </Field>

          <Btn variant="primary" size="md" onClick={handleSave}>
            {saved ? "✓ Salvato" : "Salva modifiche"}
          </Btn>
        </Section>

        {/* Password */}
        <Section title="Sicurezza">
          <Field label="Password attuale">
            <input style={inputStyle} type="password" placeholder="••••••••" />
          </Field>
          <Field label="Nuova password">
            <input style={inputStyle} type="password" placeholder="••••••••" />
          </Field>
          <Field label="Conferma nuova password">
            <input style={inputStyle} type="password" placeholder="••••••••" />
          </Field>
          <Btn variant="secondary" size="md">Aggiorna password</Btn>
        </Section>

        {/* Danger zone */}
        <Section title="Zona pericolosa">
          <p style={{ fontSize: 13, color: "var(--color-text-2)", marginBottom: 16, lineHeight: 1.6 }}>
            L&apos;eliminazione dell&apos;account è permanente e rimuove tutte le trascrizioni salvate.
          </p>
          <Btn variant="danger" size="md">Elimina account</Btn>
        </Section>
      </main>
    </div>
  );
}
