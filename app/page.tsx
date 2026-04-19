"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type Utterance = {
  speaker: string;
  start: number;
  end: number;
  text: string;
};

type TranscriptResult = {
  text: string;
  utterances: Utterance[];
  duration: number;
};

type Status = "idle" | "uploading" | "submitting" | "processing" | "completed" | "error";

type HistoryItem = {
  id: string;
  filename: string;
  date: string;
  fileSize: number;
  result: TranscriptResult;
};

const SPEAKER_COLORS: Record<string, string> = {
  A: "bg-blue-100 text-blue-800 border-blue-200",
  B: "bg-green-100 text-green-800 border-green-200",
  C: "bg-purple-100 text-purple-800 border-purple-200",
  D: "bg-orange-100 text-orange-800 border-orange-200",
  E: "bg-pink-100 text-pink-800 border-pink-200",
};

const STEPS = [
  { key: "uploading", label: "Caricamento" },
  { key: "submitting", label: "Avvio" },
  { key: "processing", label: "Elaborazione" },
];

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m === 0) return `${s} sec`;
  return `${m} min${s > 0 ? ` ${s} sec` : ""}`;
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function estimateWaitMinutes(fileSizeBytes: number): number {
  // Assume ~96kbps average for M4A/AAC lectures
  const estimatedAudioSec = (fileSizeBytes * 8) / (96 * 1000);
  // AssemblyAI universal-3-pro: roughly 5x real-time
  const processingMin = estimatedAudioSec / 5 / 60;
  return Math.max(1, Math.round(processingMin));
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const HISTORY_KEY = "transcriber_history";
const MAX_HISTORY = 20;

function loadHistory(): HistoryItem[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveToHistory(item: HistoryItem) {
  const existing = loadHistory().filter((h) => h.id !== item.id);
  const updated = [item, ...existing].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

function deleteFromHistory(id: string) {
  const updated = loadHistory().filter((h) => h.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export default function Home() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<TranscriptResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [currentId, setCurrentId] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const startTimer = () => {
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const pollStatus = useCallback(
    (id: string, name: string, size: number) => {
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/status/${id}`);
          const data = await res.json();

          if (data.error) {
            stopPolling();
            stopTimer();
            setErrorMsg(data.error);
            setStatus("error");
            return;
          }

          if (data.status === "completed") {
            stopPolling();
            stopTimer();
            setResult(data);
            setStatus("completed");

            const item: HistoryItem = {
              id,
              filename: name,
              date: new Date().toISOString(),
              fileSize: size,
              result: data,
            };
            saveToHistory(item);
            setHistory(loadHistory());
          }
        } catch {
          stopPolling();
          stopTimer();
          setErrorMsg("Errore di connessione durante l'elaborazione");
          setStatus("error");
        }
      }, 3000);
    },
    []
  );

  const processFile = useCallback(
    async (file: File) => {
      const validExt = /\.(mp3|wav|m4a|ogg|webm|mp4|flac)$/i;
      if (!validExt.test(file.name)) {
        setErrorMsg("Formato non supportato. Usa MP3, WAV, M4A, OGG, FLAC o MP4.");
        setStatus("error");
        return;
      }

      setFileName(file.name);
      setFileSize(file.size);
      setResult(null);
      setErrorMsg("");
      setCurrentId("");
      setStatus("uploading");
      startTimer();

      try {
        const uploadForm = new FormData();
        uploadForm.append("audio", file);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadForm,
        });
        const uploadData = await uploadRes.json();

        if (uploadData.error) {
          stopTimer();
          setErrorMsg(uploadData.error);
          setStatus("error");
          return;
        }

        setStatus("submitting");

        const transcribeRes = await fetch("/api/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ upload_url: uploadData.upload_url }),
        });
        const data = await transcribeRes.json();

        if (data.error) {
          stopTimer();
          setErrorMsg(data.error);
          setStatus("error");
          return;
        }

        setCurrentId(data.id);
        setStatus("processing");
        pollStatus(data.id, file.name, file.size);
      } catch {
        stopTimer();
        setErrorMsg("Errore durante il caricamento del file");
        setStatus("error");
      }
    },
    [pollStatus]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleReset = () => {
    stopPolling();
    stopTimer();
    setStatus("idle");
    setResult(null);
    setErrorMsg("");
    setFileName("");
    setFileSize(0);
    setElapsed(0);
    setCurrentId("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openFromHistory = (item: HistoryItem) => {
    handleReset();
    setFileName(item.filename);
    setFileSize(item.fileSize);
    setResult(item.result);
    setCurrentId(item.id);
    setStatus("completed");
    setHistoryOpen(false);
  };

  const removeFromHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteFromHistory(id);
    setHistory(loadHistory());
  };

  const buildPlainText = (r: TranscriptResult) =>
    r.utterances.length > 0
      ? r.utterances
          .map((u) => `[${formatTime(u.start)}] Relatore ${u.speaker}: ${u.text}`)
          .join("\n\n")
      : (r.text ?? "");

  const copyToClipboard = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(buildPlainText(result));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTxt = () => {
    if (!result) return;
    const blob = new Blob([buildPlainText(result)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName.replace(/\.[^.]+$/, "") + "_trascrizione.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const isProcessing = ["uploading", "submitting", "processing"].includes(status);
  const currentStep = STEPS.findIndex((s) => s.key === status);
  const estimatedMin = estimateWaitMinutes(fileSize);

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Trascrittore Audio</h1>
            <p className="text-gray-500 mt-1 text-sm">
              Trascrizione automatica con identificazione dei relatori
            </p>
          </div>
          {history.length > 0 && (
            <button
              onClick={() => setHistoryOpen((o) => !o)}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors shadow-sm"
            >
              <span>🕘</span>
              <span>Storico ({history.length})</span>
            </button>
          )}
        </div>

        {/* History panel */}
        {historyOpen && history.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="font-medium text-gray-700 text-sm">Trascrizioni precedenti</span>
              <button
                onClick={() => setHistoryOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ×
              </button>
            </div>
            <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => openFromHistory(item)}
                  className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer group transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-700 truncate">{item.filename}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(item.date)}
                      {item.result.duration ? ` · ${formatDuration(item.result.duration)}` : ""}
                      {item.fileSize ? ` · ${formatFileSize(item.fileSize)}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={(e) => removeFromHistory(item.id, e)}
                    className="ml-3 text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-lg leading-none"
                    title="Elimina"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload area */}
        {(status === "idle" || status === "error") && (
          <>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer transition-all
                ${isDragging ? "border-blue-400 bg-blue-50 scale-[1.01]" : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50"}
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp3,.wav,.m4a,.ogg,.webm,.mp4,.flac"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="text-5xl mb-4">🎙️</div>
              <p className="text-lg font-medium text-gray-700 mb-1">
                Trascina qui il tuo file audio
              </p>
              <p className="text-sm text-gray-400 mb-5">oppure clicca per selezionarlo</p>
              <p className="text-xs text-gray-400">MP3 · WAV · M4A · OGG · FLAC · MP4 · max 500MB</p>
            </div>
            {status === "error" && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {errorMsg}
              </div>
            )}
          </>
        )}

        {/* Processing */}
        {isProcessing && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-6">
            {/* Step indicators */}
            <div className="flex items-center gap-0">
              {STEPS.map((step, i) => {
                const done = i < currentStep;
                const active = i === currentStep;
                return (
                  <div key={step.key} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                          ${done ? "bg-blue-600 text-white" : active ? "bg-blue-100 text-blue-700 ring-2 ring-blue-400" : "bg-gray-100 text-gray-400"}`}
                      >
                        {done ? "✓" : i + 1}
                      </div>
                      <span className={`text-xs mt-1.5 font-medium ${active ? "text-blue-600" : done ? "text-gray-500" : "text-gray-300"}`}>
                        {step.label}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`h-0.5 flex-1 mx-1 mb-4 rounded transition-all ${done ? "bg-blue-400" : "bg-gray-100"}`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* File info */}
            <div className="text-center space-y-1">
              <p className="font-medium text-gray-700 truncate">{fileName}</p>
              <p className="text-sm text-gray-400">{formatFileSize(fileSize)}</p>
            </div>

            {/* Animated bar */}
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  status === "processing" ? "bg-blue-400 animate-pulse" : "bg-blue-400"
                }`}
                style={{
                  width: status === "uploading" ? "33%" : status === "submitting" ? "66%" : "85%",
                }}
              />
            </div>

            {/* Time info */}
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Tempo trascorso: <span className="font-mono text-gray-600">{formatElapsed(elapsed)}</span></span>
              {status === "processing" && (
                <span>Stima attesa: ~{estimatedMin} {estimatedMin === 1 ? "minuto" : "minuti"}</span>
              )}
            </div>

            {status === "processing" && (
              <p className="text-xs text-gray-400 text-center">
                Puoi lasciare aperta questa scheda — la trascrizione continua in background
              </p>
            )}
          </div>
        )}

        {/* Result */}
        {status === "completed" && result && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3 text-sm text-gray-500 min-w-0">
                <span className="font-medium text-gray-700 truncate max-w-[180px]">{fileName}</span>
                {result.duration > 0 && <span>⏱ {formatDuration(result.duration)}</span>}
                {result.utterances.length > 0 && (
                  <span>👥 {new Set(result.utterances.map((u) => u.speaker)).size} relatori</span>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={copyToClipboard}
                  className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  {copied ? "✓ Copiato" : "Copia"}
                </button>
                <button
                  onClick={downloadTxt}
                  className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Scarica .txt
                </button>
                <button
                  onClick={handleReset}
                  className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Nuovo file
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {result.utterances.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {result.utterances.map((u, i) => (
                    <div key={i} className="p-5 flex gap-4">
                      <div className="flex-shrink-0 pt-0.5">
                        <span
                          className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full border ${
                            SPEAKER_COLORS[u.speaker] ?? "bg-gray-100 text-gray-700 border-gray-200"
                          }`}
                        >
                          {u.speaker}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400 mb-1 font-mono">
                          {formatTime(u.start)} – {formatTime(u.end)}
                        </p>
                        <p className="text-gray-800 leading-relaxed">{u.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{result.text}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
