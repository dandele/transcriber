"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Btn, Card } from "../../components/ui";
import { ProfileDropdown } from "../../components/ProfileDropdown";
import { loadHistory } from "../../lib/history";
import type { HistoryItem } from "../../lib/types";
import { formatDuration, formatDate, countWords } from "../../lib/utils";
import { useIsMobile } from "../../lib/useIsMobile";

function computeStats(history: HistoryItem[]) {
  const totalDurationSec = history.reduce((acc, h) => acc + (h.result.duration ?? 0), 0);
  const totalWords = history.reduce((acc, h) => {
    const src = h.result.utterances.length > 0
      ? h.result.utterances.map((u) => u.text).join(" ")
      : (h.result.text ?? "");
    return acc + countWords(src);
  }, 0);
  const thisMonth = history.filter((h) => {
    const d = new Date(h.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  return {
    count: String(thisMonth || 0),
    hours: (totalDurationSec / 3600).toFixed(1),
    words: totalWords >= 1000 ? `${(totalWords / 1000).toFixed(0)}k` : String(totalWords),
  };
}

export default function DashboardPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const isMobile = useIsMobile();

  useEffect(() => { loadHistory().then(setHistory); }, []);

  const stats = computeStats(history);
  const recent = history.slice(0, 4);

  const STAT_CARDS = [
    { label: "Trascrizioni", value: stats.count, sub: "questo mese" },
    { label: "Ore trascritte", value: stats.hours, sub: "totali" },
    { label: "Parole generate", value: stats.words || "0", sub: "totali" },
  ];

  const px = isMobile ? 16 : 40;

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
      {/* Header — desktop only (mobile uses layout top bar) */}
      {!isMobile && (
        <header style={{
          padding: `0 ${px}px`, height: 64,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: "1px solid var(--color-border-subtle)",
          background: "var(--color-bg-card)",
          position: "sticky", top: 0, zIndex: 10,
        }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-1)" }}>
            Benvenuto 👋
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/upload">
              <Btn variant="primary" size="sm">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M6.5 9V1.5m0 0L4 4m2.5-2.5L9 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M1 10v1a1 1 0 001 1h9a1 1 0 001-1v-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                Nuova trascrizione
              </Btn>
            </Link>
            <div style={{ width: 200 }}>
              <ProfileDropdown direction="down" />
            </div>
          </div>
        </header>
      )}

      <main style={{ padding: isMobile ? "24px 16px" : "36px 40px", maxWidth: 900, margin: "0 auto" }}>
        {/* Stats */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gap: 12, marginBottom: isMobile ? 20 : 36,
        }}>
          {STAT_CARDS.map((s) => (
            <Card key={s.label} style={{ padding: isMobile ? "16px 20px" : "20px 24px" }}>
              <div style={{
                fontFamily: "var(--font-dm-serif), 'DM Serif Display', serif",
                fontSize: isMobile ? 28 : 32, color: "var(--color-text-1)", lineHeight: 1,
              }}>
                {s.value}
              </div>
              <div style={{ fontSize: 13, color: "var(--color-text-2)", marginTop: 6 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: "var(--color-text-3)", marginTop: 2 }}>{s.sub}</div>
            </Card>
          ))}
        </div>

        {/* Upload CTA */}
        <Link href="/upload" style={{ textDecoration: "none" }}>
          <div
            style={{
              border: "2px dashed var(--color-border)", borderRadius: "var(--radius-lg)",
              padding: isMobile ? "20px 20px" : "28px 32px",
              display: "flex", alignItems: isMobile ? "flex-start" : "center",
              flexDirection: isMobile ? "column" : "row",
              justifyContent: "space-between", gap: 16,
              cursor: "pointer", marginBottom: isMobile ? 24 : 36,
              background: "var(--color-bg-card)", transition: "border-color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
          >
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, color: "var(--color-text-1)", marginBottom: 4 }}>
                Carica un nuovo audio
              </div>
              <div style={{ fontSize: 13, color: "var(--color-text-2)" }}>
                MP3, MP4, WAV, M4A, OGG — fino a 500 MB
              </div>
            </div>
            <Btn variant="primary" size={isMobile ? "sm" : "md"}>Carica file</Btn>
          </div>
        </Link>

        {/* Recent */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{
              fontFamily: "var(--font-dm-serif), 'DM Serif Display', serif",
              fontSize: 20, fontWeight: 400, color: "var(--color-text-1)", margin: 0,
            }}>
              Recenti
            </h2>
            {history.length > 0 && (
              <Link href="/history" style={{
                fontSize: 13, color: "var(--color-accent-text)", textDecoration: "none",
                display: "flex", alignItems: "center", gap: 4,
              }}>
                Vedi tutto
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            )}
          </div>

          {recent.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "var(--color-text-3)", fontSize: 14 }}>
              Nessuna trascrizione ancora.{" "}
              <Link href="/upload" style={{ color: "var(--color-accent-text)", textDecoration: "none" }}>
                Carica il primo file
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recent.map((item) => {
                const wordCount = item.result.utterances.length > 0
                  ? countWords(item.result.utterances.map((u) => u.text).join(" "))
                  : countWords(item.result.text ?? "");
                return (
                  <Link key={item.id} href={`/transcript/${item.id}`} style={{ textDecoration: "none" }}>
                    <Card hover style={{ padding: "14px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 14, fontWeight: 500, color: "var(--color-text-1)",
                            marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          }}>
                            {item.filename}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--color-text-3)", display: "flex", gap: 10, flexWrap: "wrap" }}>
                            {item.result.duration > 0 && <span>{formatDuration(item.result.duration)}</span>}
                            <span>{wordCount.toLocaleString("it-IT")} parole</span>
                            {!isMobile && <span>{formatDate(item.date)}</span>}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                          <Badge variant="success">Completata</Badge>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "var(--color-text-3)" }}>
                            <path d="M2 7h10M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Mobile: CTA nuova trascrizione in fondo */}
        {isMobile && (
          <div style={{ marginTop: 32 }}>
            <Link href="/upload">
              <Btn variant="primary" size="lg" fullWidth>+ Nuova trascrizione</Btn>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
