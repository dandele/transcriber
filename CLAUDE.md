# Trascrittore Audio

App Next.js per trascrizione audio con AssemblyAI. Deploy su Vercel.

## Stack
- Next.js 16 (App Router)
- AssemblyAI SDK (speaker diarization, timestamps, italiano)
- Tailwind CSS
- Deploy: Vercel

## Variabili d'ambiente
- `ASSEMBLYAI_API_KEY` — da impostare nelle env vars di Vercel (NON committare)

## API Routes
- `POST /api/transcribe` — carica file e avvia trascrizione, ritorna `{ id }`
- `GET /api/status/[id]` — polling stato, ritorna trascrizione completa quando pronta

## Sviluppo locale
```bash
npm run dev
```

## Deploy
Push su GitHub → Vercel rileva automaticamente Next.js e deploya.
Ricordare di aggiungere `ASSEMBLYAI_API_KEY` nelle Environment Variables di Vercel.
