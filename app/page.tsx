"use client";

import { useState, useRef, useCallback } from "react";

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

type Status = "idle" | "uploading" | "processing" | "completed" | "error";

const SPEAKER_COLORS: Record<string, string> = {
  A: "bg-blue-100 text-blue-800 border-blue-200",
  B: "bg-green-100 text-green-800 border-green-200",
  C: "bg-purple-100 text-purple-800 border-purple-200",
  D: "bg-orange-100 text-orange-800 border-orange-200",
  E: "bg-pink-100 text-pink-800 border-pink-200",
};

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m} min ${s} sec`;
}

export default function Home() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<TranscriptResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const pollStatus = useCallback((id: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/status/${id}`);
        const data = await res.json();

        if (data.error) {
          stopPolling();
          setErrorMsg(data.error);
          setStatus("error");
          return;
        }

        if (data.status === "completed") {
          stopPolling();
          setResult(data);
          setStatus("completed");
        }
      } catch {
        stopPolling();
        setErrorMsg("Errore di connessione durante il polling");
        setStatus("error");
      }
    }, 3000);
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      const validExt = /\.(mp3|wav|m4a|ogg|webm|mp4|flac)$/i;
      if (!validExt.test(file.name)) {
        setErrorMsg("Formato non supportato. Usa MP3, WAV, M4A, OGG, FLAC o MP4.");
        setStatus("error");
        return;
      }

      setFileName(file.name);
      setResult(null);
      setErrorMsg("");
      setStatus("uploading");

      const formData = new FormData();
      formData.append("audio", file);

      try {
        const res = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        if (data.error) {
          setErrorMsg(data.error);
          setStatus("error");
          return;
        }

        setStatus("processing");
        pollStatus(data.id);
      } catch {
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleReset = () => {
    stopPolling();
    setStatus("idle");
    setResult(null);
    setErrorMsg("");
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const buildPlainText = () => {
    if (!result) return "";
    return result.utterances.length > 0
      ? result.utterances
          .map((u) => `[${formatTime(u.start)}] Relatore ${u.speaker}: ${u.text}`)
          .join("\n\n")
      : (result.text ?? "");
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(buildPlainText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTxt = () => {
    if (!result) return;
    const blob = new Blob([buildPlainText()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName.replace(/\.[^.]+$/, "") + "_trascrizione.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Trascrittore Audio</h1>
          <p className="text-gray-500">
            Carica un file audio e ottieni la trascrizione con identificazione dei relatori
          </p>
        </div>

        {(status === "idle" || status === "error") && (
          <>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
                ${isDragging ? "border-blue-400 bg-blue-50" : "border-gray-300 bg-white hover:border-blue-300 hover:bg-blue-50"}
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
              <p className="text-sm text-gray-400 mb-4">oppure clicca per selezionarlo</p>
              <p className="text-xs text-gray-400">MP3 · WAV · M4A · OGG · FLAC · MP4 · max 500MB</p>
            </div>
            {status === "error" && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {errorMsg}
              </div>
            )}
          </>
        )}

        {status === "uploading" && (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
            <div className="text-4xl mb-4">⬆️</div>
            <p className="font-medium text-gray-700">Caricamento in corso…</p>
            <p className="text-sm text-gray-400 mt-1">{fileName}</p>
            <div className="mt-6 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-400 rounded-full animate-pulse w-2/3" />
            </div>
          </div>
        )}

        {status === "processing" && (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
            <div className="flex justify-center mb-4">
              <svg className="animate-spin h-10 w-10 text-blue-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
            <p className="font-medium text-gray-700">Trascrizione in elaborazione…</p>
            <p className="text-sm text-gray-400 mt-1">{fileName}</p>
            <p className="text-xs text-gray-400 mt-3">I file lunghi possono richiedere qualche minuto</p>
          </div>
        )}

        {status === "completed" && result && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl px-6 py-4 shadow-sm border border-gray-100 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="font-medium text-gray-700 truncate max-w-[200px]">{fileName}</span>
                {result.duration && <span>⏱ {formatDuration(result.duration)}</span>}
                {result.utterances.length > 0 && (
                  <span>👥 {new Set(result.utterances.map((u) => u.speaker)).size} relatori</span>
                )}
              </div>
              <div className="flex gap-2">
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
