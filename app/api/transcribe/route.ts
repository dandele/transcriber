import { AssemblyAI } from "assemblyai";
import { NextRequest, NextResponse } from "next/server";

const client = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("audio") as File;

    if (!file) {
      return NextResponse.json({ error: "Nessun file fornito" }, { status: 400 });
    }

    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File troppo grande (max 500MB)" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadUrl = await client.files.upload(buffer);

    const transcript = await client.transcripts.submit({
      audio_url: uploadUrl,
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
