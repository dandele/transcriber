"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge, Btn } from "../../../components/ui";
import { getFromHistory } from "../../../lib/history";
import type { HistoryItem, Utterance } from "../../../lib/types";
import { formatTime, formatDuration, formatDate, countWords } from "../../../lib/utils";
import { useIsMobile } from "../../../lib/useIsMobile";

// ── Speaker colors ────────────────────────────────────────────────────────────

const SPEAKER_COLORS = [
  { text: "var(--speaker-1)" },
  { text: "var(--speaker-2)" },
  { text: "var(--speaker-3)" },
  { text: "var(--speaker-4)" },
  { text: "var(--speaker-5)" },
];
const SPEAKER_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];

function speakerColor(speaker: string) {
  const idx = SPEAKER_LABELS.indexOf(speaker.toUpperCase());
  return SPEAKER_COLORS[idx >= 0 ? idx % SPEAKER_COLORS.length : 0];
}

// ── Export helpers ────────────────────────────────────────────────────────────

function buildPlainText(utterances: Utterance[], fallback: string): string {
  return utterances.length > 0
    ? utterances.map((u) => `[${formatTime(u.start)}] Relatore ${u.speaker}: ${u.text}`).join("\n\n")
    : fallback;
}

function escapeRtf(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/[^\x00-\x7F]/g, (c) => `\\u${c.charCodeAt(0)}?`);
}

function buildRtf(filename: string, utterances: Utterance[], fallback: string): string {
  const title = escapeRtf(filename.replace(/\.[^.]+$/, ""));
  let body = "";
  if (utterances.length > 0) {
    body = utterances
      .map((u) => `\\b ${escapeRtf(`Relatore ${u.speaker} [${formatTime(u.start)}]`)}\\b0\\par ${escapeRtf(u.text)}\\par\\par`)
      .join("");
  } else {
    body = escapeRtf(fallback).replace(/\n/g, "\\par ");
  }
  return `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0\\fswiss Arial;}}\\f0\\fs24 {\\b\\fs28 ${title}}\\par\\par ${body}}`;
}

function download(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div style={{
      position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
      background: "var(--color-text-1)", color: "#fff",
      padding: "10px 20px", borderRadius: "var(--radius-full)",
      fontSize: 13, fontWeight: 500, zIndex: 9999,
      boxShadow: "var(--shadow-lg)", pointerEvents: "none",
      animation: "none",
    }}>
      {message}
    </div>
  );
}

// ── ExportMenu ────────────────────────────────────────────────────────────────

type ExportHandlers = {
  onTxt: () => void;
  onDocx: () => void;
  onPdf: () => void;
  onNotion: () => void;
  onGoogleDocs: () => void;
};

function ExportMenu(handlers: ExportHandlers) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const items = [
    { label: "TXT",         icon: "📄", action: handlers.onTxt },
    { label: "DOCX",        icon: "📝", action: handlers.onDocx },
    { label: "PDF",         icon: "📋", action: handlers.onPdf },
    { label: "Notion",      icon: "🔗", action: handlers.onNotion },
    { label: "Google Docs", icon: "📊", action: handlers.onGoogleDocs },
  ];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <Btn variant="primary" size="sm" onClick={() => setOpen((o) => !o)}>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path d="M6.5 9V1.5m0 0L4 4m2.5-2.5L9 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M1 10v1a1 1 0 001 1h9a1 1 0 001-1v-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        Esporta
      </Btn>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0,
          background: "var(--color-bg-card)", border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)", padding: 6, minWidth: 160, zIndex: 100,
          boxShadow: "var(--shadow-lg)",
        }}>
          {items.map(({ label, icon, action }) => (
            <button
              key={label}
              onClick={() => { action(); setOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%",
                padding: "8px 12px", border: "none", background: "none", cursor: "pointer",
                fontSize: 13, color: "var(--color-text-1)", textAlign: "left",
                borderRadius: "var(--radius-md)", fontFamily: "inherit", transition: "background 0.12s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-subtle)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <span>{icon}</span> {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TranscriptPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const isMobile = useIsMobile();
  const [item, setItem] = useState<HistoryItem | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [search, setSearch] = useState("");
  const [activeSegment, setActiveSegment] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    getFromHistory(id).then((found) => {
      if (found) setItem(found);
      else setNotFound(true);
    });
  }, [id]);

  const showToast = useCallback((msg: string) => setToast(msg), []);

  if (notFound) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-bg)" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 16, color: "var(--color-text-2)", marginBottom: 16 }}>Trascrizione non trovata.</p>
          <Btn variant="secondary" size="md" onClick={() => router.push("/history")}>Torna allo storico</Btn>
        </div>
      </div>
    );
  }

  if (!item) return null;

  const { result, filename, date } = item;
  const utterances = result.utterances ?? [];
  const totalText = utterances.length > 0 ? utterances.map((u) => u.text).join(" ") : (result.text ?? "");
  const wordCount = countWords(totalText);
  const uniqueSpeakers = [...new Set(utterances.map((u) => u.speaker))];
  const baseName = filename.replace(/\.[^.]+$/, "");

  const filtered = utterances.filter((u) =>
    !search || u.text.toLowerCase().includes(search.toLowerCase()) || u.speaker.toLowerCase().includes(search.toLowerCase())
  );

  // ── Export handlers ──
  const handleTxt = () => {
    download(buildPlainText(utterances, result.text ?? ""), `${baseName}_trascrizione.txt`, "text/plain;charset=utf-8");
    showToast("File TXT scaricato");
  };

  const handleDocx = () => {
    download(buildRtf(filename, utterances, result.text ?? ""), `${baseName}_trascrizione.rtf`, "application/rtf");
    showToast("File RTF scaricato — apribile con Word");
  };

  const handlePdf = () => {
    window.print();
  };

  const handleNotion = () => showToast("Export Notion richiede OAuth — disponibile prossimamente");
  const handleGoogleDocs = () => showToast("Export Google Docs richiede OAuth — disponibile prossimamente");

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(buildPlainText(utterances, result.text ?? ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportHandlers: ExportHandlers = { onTxt: handleTxt, onDocx: handleDocx, onPdf: handlePdf, onNotion: handleNotion, onGoogleDocs: handleGoogleDocs };

  const sidebarExportItems = [
    { icon: "📄", label: "TXT",         action: handleTxt },
    { icon: "📝", label: "DOCX",        action: handleDocx },
    { icon: "📋", label: "PDF",         action: handlePdf },
    { icon: "🔗", label: "Notion",      action: handleNotion },
    { icon: "📊", label: "Google Docs", action: handleGoogleDocs },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)", display: "flex", flexDirection: "column" }}>
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      {/* Header */}
      <header data-noprint style={{
        padding: isMobile ? "0 16px" : "0 32px",
        height: isMobile ? 52 : 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid var(--color-border-subtle)",
        background: "var(--color-bg-card)",
        position: "sticky", top: isMobile ? 56 : 0, zIndex: 10,
        gap: 12,
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {filename}
          </div>
          <div style={{ fontSize: 11, color: "var(--color-text-3)", marginTop: 1, display: "flex", gap: 8 }}>
            {result.duration > 0 && <span>{formatDuration(result.duration)}</span>}
            <span>{wordCount.toLocaleString("it-IT")} parole</span>
            {!isMobile && <span>{formatDate(date)}</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
          {!isMobile && (
            <Btn variant="ghost" size="sm" onClick={() => setShowSummary((s) => !s)}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 3h10M2 7h7M2 11h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              Riassunto AI
            </Btn>
          )}
          <Btn variant="secondary" size="sm" onClick={copyToClipboard}>
            {copied ? "✓" : isMobile ? "Copia" : "Copia"}
          </Btn>
          <ExportMenu {...exportHandlers} />
        </div>
      </header>

      {/* Body */}
      <div data-printarea style={{
        display: "flex", flex: 1,
        maxWidth: 900, margin: "0 auto", width: "100%",
        padding: isMobile ? "0 16px" : "0 24px", gap: 24,
      }}>
        {/* Main column */}
        <div style={{ flex: 1, padding: isMobile ? "20px 0" : "28px 0" }}>
          {/* AI Summary */}
          {showSummary && (
            <div style={{
              marginBottom: 24, background: "var(--color-accent-light)",
              border: "1px solid oklch(0.85 0.06 48)",
              borderRadius: "var(--radius-lg)", padding: 20,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 16 }}>✨</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-accent-text)" }}>Riassunto generato da AI</span>
              </div>
              <p style={{ fontSize: 14, color: "var(--color-text-1)", lineHeight: 1.7, margin: 0 }}>
                Questa funzionalità richiede integrazione con un modello AI dedicato.
                Il testo completo della trascrizione è disponibile qui sotto.
              </p>
            </div>
          )}

          {/* Search */}
          {utterances.length > 1 && (
            <div data-noprint style={{ marginBottom: 20, position: "relative" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-3)" }}
              >
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <input
                placeholder="Cerca nella trascrizione…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%", padding: "9px 14px 9px 36px",
                  border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)",
                  fontSize: 14, color: "var(--color-text-1)",
                  background: "var(--color-bg-card)", outline: "none",
                  fontFamily: "inherit", boxSizing: "border-box",
                }}
              />
            </div>
          )}

          {/* Segments */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {utterances.length > 0 ? (
              (search ? filtered : utterances).map((u, i) => {
                const color = speakerColor(u.speaker);
                const isActive = activeSegment === i;
                return (
                  <div
                    key={i}
                    data-segment
                    onClick={() => setActiveSegment(isActive ? null : i)}
                    style={{
                      display: "flex", gap: 16, padding: "14px 16px",
                      borderRadius: "var(--radius-md)",
                      background: isActive ? "var(--color-accent-light)" : "transparent",
                      border: `1px solid ${isActive ? "oklch(0.85 0.06 48)" : "transparent"}`,
                      cursor: "pointer", transition: "background 0.12s ease",
                    }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--color-bg-subtle)"; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{ width: 70, flexShrink: 0, paddingTop: 2 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: color.text, marginBottom: 3 }}>{u.speaker}</div>
                      <div style={{ fontSize: 11, color: "var(--color-text-3)", fontVariantNumeric: "tabular-nums" }}>{formatTime(u.start)}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--color-text-1)", margin: 0 }}>{u.text}</p>
                      {isActive && (
                        <div data-noprint style={{ display: "flex", gap: 8, marginTop: 10 }}>
                          <button style={{ fontSize: 12, color: "var(--color-accent-text)", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}>✏️ Modifica</button>
                          <button style={{ fontSize: 12, color: "var(--color-text-3)", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}>🔊 Ascolta</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: "24px 0" }}>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--color-text-1)", whiteSpace: "pre-wrap" }}>{result.text}</p>
              </div>
            )}
            {search && filtered.length === 0 && (
              <div style={{ padding: "32px", textAlign: "center", color: "var(--color-text-3)", fontSize: 14 }}>
                Nessun risultato per &ldquo;{search}&rdquo;
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar — desktop only */}
        {!isMobile && <div data-noprint style={{ width: 220, padding: "28px 0", flexShrink: 0 }}>
          <div style={{ position: "sticky", top: 88, display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Status */}
            <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-lg)", padding: 16, boxShadow: "var(--shadow-sm)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Stato</div>
              <Badge variant="success">Completata</Badge>
            </div>

            {/* Speakers */}
            {uniqueSpeakers.length > 0 && (
              <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-lg)", padding: 16, boxShadow: "var(--shadow-sm)" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Relatori</div>
                {uniqueSpeakers.map((sp) => {
                  const c = speakerColor(sp);
                  return (
                    <div key={sp} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.text, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: "var(--color-text-2)" }}>Relatore {sp}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Export */}
            <div style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border-subtle)", borderRadius: "var(--radius-lg)", padding: 16, boxShadow: "var(--shadow-sm)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Esporta</div>
              {sidebarExportItems.map(({ icon, label, action }) => (
                <button
                  key={label}
                  onClick={action}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, width: "100%",
                    padding: "7px 8px", borderRadius: "var(--radius-md)", border: "none",
                    background: "none", cursor: "pointer", fontSize: 13,
                    color: "var(--color-text-2)", textAlign: "left", fontFamily: "inherit",
                    transition: "background 0.12s", marginBottom: 2,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-subtle)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  <span>{icon}</span> {label}
                </button>
              ))}
            </div>

            <Btn variant="secondary" size="sm" fullWidth onClick={() => showToast("Link copiato negli appunti")}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <circle cx="10" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <circle cx="10" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <circle cx="3" cy="6.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M4.4 7.3l4.2 2M4.4 5.7l4.2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              Condividi link
            </Btn>
          </div>
        </div>}
      </div>
    </div>
  );
}
