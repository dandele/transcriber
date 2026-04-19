"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Btn } from "../../components/ui";
import { loadHistory, deleteFromHistory } from "../../lib/history";
import type { HistoryItem } from "../../lib/types";
import { formatDuration, formatDate, countWords, formatFileSize } from "../../lib/utils";
import { useIsMobile } from "../../lib/useIsMobile";

type SortKey = "date" | "name" | "duration" | "words";
type ViewMode = "list" | "grid";

function getExt(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "audio";
}

function getWordCount(item: HistoryItem): number {
  const src = item.result.utterances.length > 0
    ? item.result.utterances.map((u) => u.text).join(" ")
    : (item.result.text ?? "");
  return countWords(src);
}

function sortItems(items: HistoryItem[], key: SortKey): HistoryItem[] {
  return [...items].sort((a, b) => {
    if (key === "date") return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (key === "name") return a.filename.localeCompare(b.filename, "it");
    if (key === "duration") return (b.result.duration ?? 0) - (a.result.duration ?? 0);
    if (key === "words") return getWordCount(b) - getWordCount(a);
    return 0;
  });
}

function HistoryRow({ item, onDelete, isMobile }: { item: HistoryItem; onDelete: () => void; isMobile: boolean }) {
  const [hovered, setHovered] = useState(false);
  const words = getWordCount(item);
  const ext = getExt(item.filename);

  return (
    <Link href={`/transcript/${item.id}`} style={{ textDecoration: "none" }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: isMobile ? "12px 14px" : "14px 18px",
          borderRadius: 10, cursor: "pointer",
          background: hovered ? "var(--color-bg-card)" : "transparent",
          border: `1px solid ${hovered ? "var(--color-border)" : "transparent"}`,
          transition: "all 0.12s ease",
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: "var(--radius-md)", flexShrink: 0,
          background: "var(--color-accent-light)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--color-accent-text)", textTransform: "uppercase" }}>
            {ext}
          </span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 500, color: "var(--color-text-1)", marginBottom: 2,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {item.filename.replace(/\.[^.]+$/, "")}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {item.result.duration > 0 && (
              <span style={{ fontSize: 11, color: "var(--color-text-3)" }}>{formatDuration(item.result.duration)}</span>
            )}
            <span style={{ fontSize: 11, color: "var(--color-text-3)" }}>{words.toLocaleString("it-IT")} parole</span>
            {!isMobile && <span style={{ fontSize: 11, color: "var(--color-text-3)" }}>{formatFileSize(item.fileSize)}</span>}
          </div>
        </div>

        <div style={{ textAlign: "right", flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>
          {!isMobile && (
            <div>
              <div style={{ fontSize: 11, color: "var(--color-text-3)", marginBottom: 4 }}>{formatDate(item.date)}</div>
              <Badge variant="success">Completata</Badge>
            </div>
          )}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--color-text-3)", fontSize: 18, padding: "2px 4px",
              borderRadius: 4, lineHeight: 1,
              opacity: isMobile ? 0.6 : (hovered ? 1 : 0),
              transition: "opacity 0.12s",
            }}
            title="Elimina"
          >
            ×
          </button>
        </div>
      </div>
    </Link>
  );
}

function HistoryCard({ item, onDelete }: { item: HistoryItem; onDelete: () => void }) {
  const words = getWordCount(item);
  const ext = getExt(item.filename);

  return (
    <Link href={`/transcript/${item.id}`} style={{ textDecoration: "none" }}>
      <div
        style={{
          background: "var(--color-bg-card)", border: "1px solid var(--color-border-subtle)",
          borderRadius: "var(--radius-lg)", padding: 16,
          boxShadow: "var(--shadow-sm)", transition: "all 0.15s ease", cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-md)";
          (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-border)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-sm)";
          (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-border-subtle)";
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{
            padding: "3px 8px", borderRadius: 6, background: "var(--color-accent-light)",
            fontSize: 10, fontWeight: 700, color: "var(--color-accent-text)", textTransform: "uppercase",
          }}>
            {ext}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Badge variant="success">✓</Badge>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--color-text-3)", fontSize: 16, padding: "1px 3px",
                borderRadius: 4, lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        </div>
        <div style={{
          fontSize: 13, fontWeight: 500, color: "var(--color-text-1)", marginBottom: 6, lineHeight: 1.4,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {item.filename.replace(/\.[^.]+$/, "")}
        </div>
        <div style={{ fontSize: 11, color: "var(--color-text-3)", marginBottom: 2 }}>
          {item.result.duration > 0 ? formatDuration(item.result.duration) : "—"} · {words.toLocaleString("it-IT")} parole
        </div>
        <div style={{ fontSize: 11, color: "var(--color-text-3)" }}>{formatDate(item.date)}</div>
      </div>
    </Link>
  );
}

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("date");
  const [view, setView] = useState<ViewMode>("list");
  const isMobile = useIsMobile();

  useEffect(() => { loadHistory().then(setItems); }, []);

  const handleDelete = async (id: string) => {
    await deleteFromHistory(id);
    loadHistory().then(setItems);
  };

  const filtered = sortItems(
    items.filter((item) => item.filename.toLowerCase().includes(search.toLowerCase())),
    sortBy
  );

  const px = isMobile ? 16 : 40;

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
      {/* Header */}
      <header style={{
        padding: `0 ${px}px`, height: isMobile ? 52 : 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid var(--color-border-subtle)",
        background: "var(--color-bg-card)",
        position: "sticky", top: isMobile ? 56 : 0, zIndex: 10,
      }}>
        <h1 style={{
          fontFamily: "var(--font-dm-serif), 'DM Serif Display', serif",
          fontSize: isMobile ? 18 : 22, fontWeight: 400, color: "var(--color-text-1)", margin: 0,
        }}>
          Storico
        </h1>
        {!isMobile && (
          <Link href="/upload">
            <Btn variant="primary" size="sm">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M6.5 9V1.5m0 0L4 4m2.5-2.5L9 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M1 10v1a1 1 0 001 1h9a1 1 0 001-1v-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              Nuova trascrizione
            </Btn>
          </Link>
        )}
      </header>

      <main style={{ padding: isMobile ? "16px" : "28px 40px" }}>
        {/* Toolbar */}
        <div style={{
          display: "flex", gap: 10, alignItems: "center", marginBottom: 16,
          flexWrap: isMobile ? "wrap" : "nowrap",
        }}>
          <div style={{ position: "relative", flex: isMobile ? "1 1 100%" : "1", maxWidth: isMobile ? "100%" : 360 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
              style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-3)", pointerEvents: "none" }}
            >
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input
              placeholder="Cerca per nome…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%", padding: "8px 14px 8px 34px",
                border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)",
                fontSize: 13, color: "var(--color-text-1)",
                background: "var(--color-bg-card)", outline: "none",
                fontFamily: "inherit", boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              style={{
                padding: "8px 10px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)",
                fontSize: 13, color: "var(--color-text-2)",
                background: "var(--color-bg-card)", outline: "none", cursor: "pointer", fontFamily: "inherit",
              }}
            >
              <option value="date">Recenti</option>
              <option value="name">Nome A-Z</option>
              <option value="duration">Durata</option>
              <option value="words">Parole</option>
            </select>

            <div style={{ display: "flex", background: "var(--color-bg-subtle)", borderRadius: 7, padding: 2, gap: 2 }}>
              {(["list", "grid"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  style={{
                    width: 30, height: 28, borderRadius: 5, border: "none",
                    background: view === v ? "var(--color-bg-card)" : "none",
                    cursor: "pointer", color: view === v ? "var(--color-text-1)" : "var(--color-text-3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: view === v ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                    transition: "all 0.12s",
                  }}
                >
                  {v === "list"
                    ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M2 7h10M2 10h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                    : <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="1.5" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="8" y="1.5" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="1.5" y="8" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="8" y="8" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.3"/></svg>
                  }
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ fontSize: 12, color: "var(--color-text-3)", marginBottom: 12 }}>
          {filtered.length} {filtered.length === 1 ? "trascrizione" : "trascrizioni"}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--color-text-3)" }}>
            <p style={{ fontSize: 14, marginBottom: 16 }}>
              {search ? `Nessun risultato per "${search}"` : "Nessuna trascrizione ancora."}
            </p>
            {!search && (
              <Link href="/upload">
                <Btn variant="primary" size="md">Carica il primo file</Btn>
              </Link>
            )}
          </div>
        )}

        {view === "list" && filtered.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {filtered.map((item) => (
              <HistoryRow key={item.id} item={item} onDelete={() => handleDelete(item.id)} isMobile={isMobile} />
            ))}
          </div>
        )}

        {view === "grid" && filtered.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
            {filtered.map((item) => (
              <HistoryCard key={item.id} item={item} onDelete={() => handleDelete(item.id)} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
