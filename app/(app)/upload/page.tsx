"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Btn } from "../../components/ui";
import { saveToHistory } from "../../lib/history";
import type { TranscriptResult } from "../../lib/types";
import { formatFileSize, formatElapsed } from "../../lib/utils";
import { useIsMobile } from "../../lib/useIsMobile";

// ── Types ─────────────────────────────────────────────────────────────────────

type FileStatus = "pending" | "uploading" | "submitting" | "processing" | "completed" | "error";

type QueueItem = {
  localId: string;
  file: File;
  status: FileStatus;
  error?: string;
  transcriptId?: string;
  elapsed: number;
};

// ── Utils ─────────────────────────────────────────────────────────────────────

const VALID_EXT = /\.(mp3|wav|m4a|m4b|aac|ogg|oga|opus|flac|wma|webm|mp4|mov|avi|mkv|3gp)$/i;

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SoundwaveAnim({ small = false }: { small?: boolean }) {
  const heights = small ? [6, 10, 14, 10, 6] : [20, 36, 52, 44, 60, 44, 52, 36, 20];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: small ? 2 : 4, height: small ? 18 : 68 }}>
      {heights.map((h, i) => (
        <div key={i} style={{
          width: small ? 2 : 4, height: h, borderRadius: 2,
          background: "var(--color-accent)",
          animation: "wave 1.2s ease-in-out infinite",
          animationDelay: `${i * 0.1}s`,
          transformOrigin: "center",
        }} />
      ))}
    </div>
  );
}

const STATUS_CONFIG: Record<FileStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending:    { label: "In attesa",    color: "var(--color-text-3)",    icon: <span style={{ fontSize: 14 }}>⏳</span> },
  uploading:  { label: "Caricamento", color: "var(--color-accent)",    icon: <SoundwaveAnim small /> },
  submitting: { label: "Invio",       color: "var(--color-accent)",    icon: <SoundwaveAnim small /> },
  processing: { label: "Trascrizione",color: "var(--color-accent)",    icon: <SoundwaveAnim small /> },
  completed:  { label: "Completato",  color: "var(--color-success)",   icon: <span style={{ fontSize: 14 }}>✓</span> },
  error:      { label: "Errore",      color: "var(--color-danger)",    icon: <span style={{ fontSize: 14 }}>✕</span> },
};

const PROGRESS_MAP: Record<FileStatus, number> = {
  pending: 0, uploading: 25, submitting: 55, processing: 82, completed: 100, error: 0,
};

function QueueRow({ item }: { item: QueueItem }) {
  const cfg = STATUS_CONFIG[item.status];
  const pct = PROGRESS_MAP[item.status];
  const isActive = ["uploading", "submitting", "processing"].includes(item.status);

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "12px 16px",
      background: "var(--color-bg-card)",
      border: `1px solid ${isActive ? "var(--color-accent)" : "var(--color-border-subtle)"}`,
      borderRadius: "var(--radius-md)",
      transition: "border-color 0.2s",
    }}>
      {/* Status icon */}
      <div style={{ width: 28, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: cfg.color }}>
        {cfg.icon}
      </div>

      {/* File info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 500, color: "var(--color-text-1)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          marginBottom: 4,
        }}>
          {item.file.name}
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: "var(--color-bg-subtle)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${pct}%`,
            background: item.status === "error" ? "var(--color-danger)" : "var(--color-accent)",
            borderRadius: "var(--radius-full)",
            transition: "width 0.6s ease",
          }} />
        </div>

        {item.status === "error" && item.error && (
          <div style={{ fontSize: 11, color: "var(--color-danger)", marginTop: 4 }}>{item.error}</div>
        )}
      </div>

      {/* Right info */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: cfg.color }}>{cfg.label}</div>
        <div style={{ fontSize: 11, color: "var(--color-text-3)", marginTop: 1 }}>
          {item.status === "completed" || item.status === "error"
            ? formatFileSize(item.file.size)
            : isActive
              ? formatElapsed(item.elapsed)
              : formatFileSize(item.file.size)}
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function UploadPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const queueRef = useRef<QueueItem[]>([]);

  // keep ref in sync with state
  useEffect(() => { queueRef.current = queue; }, [queue]);

  const updateItem = useCallback((localId: string, patch: Partial<QueueItem>) => {
    setQueue((prev) => prev.map((it) => it.localId === localId ? { ...it, ...patch } : it));
  }, []);

  const stopTimer = useCallback((localId: string) => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    updateItem(localId, {});
  }, [updateItem]);

  const startTimer = useCallback((localId: string) => {
    timerRef.current = setInterval(() => {
      setQueue((prev) => prev.map((it) =>
        it.localId === localId ? { ...it, elapsed: it.elapsed + 1 } : it
      ));
    }, 1000);
  }, []);

  const processNext = useCallback((currentQueue?: QueueItem[]) => {
    const q = currentQueue ?? queueRef.current;
    const next = q.find((it) => it.status === "pending");
    if (!next) { setProcessingId(null); return; }
    setProcessingId(next.localId);
    processFile(next.localId, next.file);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const processFile = useCallback(async (localId: string, file: File) => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    updateItem(localId, { status: "uploading", elapsed: 0 });
    startTimer(localId);

    try {
      // Upload
      const form = new FormData();
      form.append("audio", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: form });
      const uploadData = await uploadRes.json();
      if (uploadData.error) {
        stopTimer(localId);
        updateItem(localId, { status: "error", error: uploadData.error });
        processNext();
        return;
      }

      // Submit
      updateItem(localId, { status: "submitting" });
      const transcribeRes = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ upload_url: uploadData.upload_url }),
      });
      const data = await transcribeRes.json();
      if (data.error) {
        stopTimer(localId);
        updateItem(localId, { status: "error", error: data.error });
        processNext();
        return;
      }

      updateItem(localId, { status: "processing", transcriptId: data.id });

      // Poll
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/status/${data.id}`);
          const statusData = await res.json();

          if (statusData.error) {
            clearInterval(pollRef.current!); pollRef.current = null;
            stopTimer(localId);
            updateItem(localId, { status: "error", error: statusData.error });
            processNext();
            return;
          }

          if (statusData.status === "completed") {
            clearInterval(pollRef.current!); pollRef.current = null;
            stopTimer(localId);
            const result: TranscriptResult = statusData;
            await saveToHistory({ id: data.id, filename: file.name, date: new Date().toISOString(), fileSize: file.size, result });
            updateItem(localId, { status: "completed", transcriptId: data.id });
            processNext();
          }
        } catch {
          clearInterval(pollRef.current!); pollRef.current = null;
          stopTimer(localId);
          updateItem(localId, { status: "error", error: "Errore di connessione" });
          processNext();
        }
      }, 3000);
    } catch {
      stopTimer(localId);
      updateItem(localId, { status: "error", error: "Errore durante il caricamento" });
      processNext();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateItem, startTimer, stopTimer]);

  const addFiles = useCallback((files: File[]) => {
    const valid = files.filter((f) => VALID_EXT.test(f.name));
    if (valid.length === 0) return;

    const newItems: QueueItem[] = valid.map((file) => ({
      localId: uid(), file, status: "pending", elapsed: 0,
    }));

    setQueue((prev) => {
      const next = [...prev, ...newItems];
      // Start processing if nothing is running
      if (!prev.some((it) => ["uploading", "submitting", "processing"].includes(it.status))) {
        setTimeout(() => processNext(next), 0);
      }
      return next;
    });
  }, [processNext]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const allDone = queue.length > 0 && queue.every((it) => it.status === "completed" || it.status === "error");
  const isRunning = queue.some((it) => ["uploading", "submitting", "processing"].includes(it.status));
  const completedCount = queue.filter((it) => it.status === "completed").length;
  const totalCount = queue.length;

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
      {/* Header */}
      <header style={{
        padding: isMobile ? "0 16px" : "0 40px",
        height: isMobile ? 52 : 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid var(--color-border-subtle)",
        background: "var(--color-bg-card)",
        position: "sticky", top: isMobile ? 56 : 0, zIndex: 10,
      }}>
        <h1 style={{
          fontFamily: "var(--font-dm-serif), 'DM Serif Display', serif",
          fontSize: isMobile ? 17 : 18, fontWeight: 400, color: "var(--color-text-1)", margin: 0,
        }}>
          Nuova trascrizione
        </h1>
        {isRunning && (
          <span style={{ fontSize: 12, color: "var(--color-text-3)" }}>
            {completedCount} / {totalCount} completati
          </span>
        )}
      </header>

      <main style={{ maxWidth: 680, margin: "0 auto", padding: isMobile ? "24px 16px" : "48px 24px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Drop zone — always visible to add more files */}
        {!allDone && (
          <div>
            {queue.length === 0 && (
              <div style={{ marginBottom: 24 }}>
                <h2 style={{
                  fontFamily: "var(--font-dm-serif), 'DM Serif Display', serif",
                  fontSize: 28, fontWeight: 400, color: "var(--color-text-1)", marginBottom: 10,
                }}>
                  Parla. Noi trascriviamo.
                </h2>
                <p style={{ fontSize: 15, color: "var(--color-text-2)", lineHeight: 1.6, margin: 0 }}>
                  Carica uno o più file audio o video. Li trascriveremo in coda, uno alla volta.
                </p>
              </div>
            )}

            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? "var(--color-accent)" : "var(--color-border)"}`,
                borderRadius: "var(--radius-xl)",
                padding: queue.length > 0 ? "20px 24px" : isMobile ? "40px 24px" : "56px 40px",
                textAlign: "center", cursor: "pointer",
                background: isDragging ? "var(--color-accent-light)" : "var(--color-bg-card)",
                transition: "all 0.15s ease", boxShadow: "var(--shadow-sm)",
              }}
            >
              <input
                ref={fileInputRef} type="file" multiple
                accept="audio/*,video/*,.m4a,.m4b,.flac,.wma,.opus"
                style={{ display: "none" }}
                onChange={(e) => { addFiles(Array.from(e.target.files ?? [])); e.target.value = ""; }}
              />
              {queue.length === 0 ? (
                <>
                  <div style={{
                    width: 56, height: 56, borderRadius: "var(--radius-full)",
                    background: "var(--color-accent-light)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 20px",
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                    </svg>
                  </div>
                  <p style={{ fontSize: 16, fontWeight: 500, color: "var(--color-text-1)", marginBottom: 6 }}>
                    Trascina uno o più file qui
                  </p>
                  <p style={{ fontSize: 14, color: "var(--color-text-3)", marginBottom: 0 }}>
                    oppure <span style={{ color: "var(--color-accent-text)", fontWeight: 500 }}>sfoglia i file</span>
                  </p>
                  <p style={{ fontSize: 12, color: "var(--color-text-3)", marginTop: 14 }}>
                    MP3 · M4A · WAV · FLAC · OGG · MP4 · MOV — max 500 MB per file
                  </p>
                </>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "var(--color-text-2)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                  </svg>
                  <span style={{ fontSize: 14 }}>Aggiungi altri file</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Queue */}
        {queue.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {queue.length > 1 && (
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                Coda — {completedCount}/{totalCount} completati
              </div>
            )}
            {queue.map((item) => <QueueRow key={item.localId} item={item} />)}
          </div>
        )}

        {/* All done CTA */}
        {allDone && (
          <div style={{
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border-subtle)",
            borderRadius: "var(--radius-lg)", padding: "28px 32px",
            textAlign: "center", boxShadow: "var(--shadow-sm)",
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: "var(--color-success-light)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: 20, color: "var(--color-success)",
            }}>
              ✓
            </div>
            <p style={{
              fontFamily: "var(--font-dm-serif), 'DM Serif Display', serif",
              fontSize: 20, fontWeight: 400, color: "var(--color-text-1)", marginBottom: 6,
            }}>
              {completedCount === totalCount
                ? completedCount === 1 ? "Trascrizione completata!" : `${completedCount} trascrizioni completate!`
                : `${completedCount} di ${totalCount} completate`}
            </p>
            <p style={{ fontSize: 14, color: "var(--color-text-2)", marginBottom: 24 }}>
              Le trascrizioni sono disponibili nello storico.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <Btn variant="primary" size="md" onClick={() => router.push("/history")}>
                Vai allo storico
              </Btn>
              <Btn variant="secondary" size="md" onClick={() => setQueue([])}>
                Carica altri file
              </Btn>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
