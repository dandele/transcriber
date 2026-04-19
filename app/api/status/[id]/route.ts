import { AssemblyAI } from "assemblyai";
import { NextRequest, NextResponse } from "next/server";

const client = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY! });

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const transcript = await client.transcripts.get(id);

    if (transcript.status === "error") {
      return NextResponse.json({ error: transcript.error || "Trascrizione fallita" }, { status: 500 });
    }

    if (transcript.status !== "completed") {
      return NextResponse.json({ status: transcript.status });
    }

    const utterances = transcript.utterances?.map((u) => ({
      speaker: u.speaker,
      start: u.start,
      end: u.end,
      text: u.text,
    })) ?? [];

    return NextResponse.json({
      status: "completed",
      text: transcript.text,
      utterances,
      duration: transcript.audio_duration,
    });
  } catch (err) {
    console.error("Errore status:", err);
    return NextResponse.json({ error: "Errore nel recupero dello stato" }, { status: 500 });
  }
}
