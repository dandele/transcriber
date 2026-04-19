"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "../components/Logo";
import { Btn } from "../components/ui";
import { createClient } from "../lib/supabase/client";

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

const inputStyle = {
  width: "100%", padding: "10px 14px",
  border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)",
  fontSize: 14, color: "var(--color-text-1)",
  background: "var(--color-bg-card)", outline: "none",
  fontFamily: "inherit", boxSizing: "border-box" as const,
  transition: "border-color 0.15s ease",
};

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    setError("");
    const trimEmail = email.trim().toLowerCase();
    const trimName = name.trim();

    if (!trimEmail) { setError("Inserisci la tua email."); return; }
    if (!password || password.length < 6) { setError("La password deve essere di almeno 6 caratteri."); return; }
    if (mode === "register" && trimName.length < 2) { setError("Inserisci il tuo nome completo."); return; }

    setLoading(true);
    const supabase = createClient();

    if (mode === "register") {
      const { error: signUpError } = await supabase.auth.signUp({
        email: trimEmail,
        password,
        options: { data: { name: trimName } },
      });
      if (signUpError) {
        setError(translateError(signUpError.message));
        setLoading(false);
        return;
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: trimEmail,
        password,
      });
      if (signInError) {
        setError(translateError(signInError.message));
        setLoading(false);
        return;
      }
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div style={{
      minHeight: "100vh", background: "var(--color-bg)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <Logo size="lg" />
          </div>
          <p style={{ fontSize: 14, color: "var(--color-text-2)", margin: 0 }}>
            Parla. Noi trascriviamo.
          </p>
        </div>

        <div style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border-subtle)",
          borderRadius: "var(--radius-lg)", padding: 24, boxShadow: "var(--shadow-sm)",
        }}>
          {/* Tab toggle */}
          <div style={{
            display: "flex", background: "var(--color-bg)",
            borderRadius: "var(--radius-md)", padding: 3, marginBottom: 28, gap: 3,
          }}>
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                style={{
                  flex: 1, padding: "8px 0", borderRadius: 6, border: "none",
                  background: mode === m ? "var(--color-bg-card)" : "transparent",
                  color: mode === m ? "var(--color-text-1)" : "var(--color-text-2)",
                  fontSize: 13.5, fontWeight: mode === m ? 500 : 400,
                  cursor: "pointer", transition: "all 0.15s ease",
                  boxShadow: mode === m ? "var(--shadow-sm)" : "none",
                  fontFamily: "inherit",
                }}
              >
                {m === "login" ? "Accedi" : "Registrati"}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {mode === "register" && (
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--color-text-2)", marginBottom: 6 }}>
                  Nome completo
                </label>
                <input
                  style={inputStyle} placeholder="Mario Rossi"
                  value={name} onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
              </div>
            )}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--color-text-2)", marginBottom: 6 }}>
                Email
              </label>
              <input
                style={inputStyle} type="email" placeholder="mario@esempio.it"
                value={email} onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--color-text-2)", marginBottom: 6 }}>
                Password
              </label>
              <input
                style={inputStyle} type="password" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
            </div>

            {mode === "login" && (
              <div style={{ textAlign: "right", marginTop: -8 }}>
                <a href="#" style={{ fontSize: 12.5, color: "var(--color-accent-text)", textDecoration: "none" }}>
                  Password dimenticata?
                </a>
              </div>
            )}

            {error && (
              <div style={{
                fontSize: 13, color: "var(--color-danger)",
                background: "oklch(0.97 0.02 25)", border: "1px solid oklch(0.90 0.05 25)",
                borderRadius: "var(--radius-md)", padding: "10px 14px",
              }}>
                {error}
              </div>
            )}

            <Btn variant="primary" size="lg" fullWidth onClick={handleSubmit} disabled={loading}>
              {loading ? "Attendere…" : mode === "login" ? "Accedi a Detto" : "Crea il tuo account"}
            </Btn>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
            <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
            <span style={{ fontSize: 12, color: "var(--color-text-3)" }}>oppure</span>
            <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
          </div>

          <Btn variant="secondary" size="md" fullWidth disabled>
            <GoogleIcon />
            Continua con Google (prossimamente)
          </Btn>
        </div>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "var(--color-text-3)", lineHeight: 1.6 }}>
          Continuando accetti i{" "}
          <a href="#" style={{ color: "var(--color-accent-text)", textDecoration: "none" }}>Termini di Servizio</a>
          {" "}e la{" "}
          <a href="#" style={{ color: "var(--color-accent-text)", textDecoration: "none" }}>Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}

function translateError(msg: string): string {
  if (msg.includes("Invalid login credentials")) return "Email o password non corretti.";
  if (msg.includes("Email not confirmed")) return "Controlla la tua email per confermare l'account.";
  if (msg.includes("User already registered")) return "Esiste già un account con questa email. Accedi invece.";
  if (msg.includes("Password should be")) return "La password deve essere di almeno 6 caratteri.";
  if (msg.includes("Unable to validate email")) return "Indirizzo email non valido.";
  return msg;
}
