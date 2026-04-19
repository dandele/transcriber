import { AssemblyAI } from "assemblyai";
import { NextRequest, NextResponse } from "next/server";

const client = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const { upload_url } = await req.json();

    if (!upload_url) {
      return NextResponse.json({ error: "URL audio mancante" }, { status: 400 });
    }

    const transcript = await client.transcripts.submit({
      audio_url: upload_url,
      speech_models: ["universal-2"],
      language_code: "it",
      speaker_labels: true,
      punctuate: true,
      format_text: true,
    });

    return NextResponse.json({ id: transcript.id });
  } catch (err) {
    console.error("Errore trascrizione:", err);
    return NextResponse.json({ error: "Errore durante l'avvio della trascrizione" }, { status: 500 });
  }
}
