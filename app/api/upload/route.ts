import { AssemblyAI } from "assemblyai";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const client = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("audio") as File;

    if (!file) {
      return NextResponse.json({ error: "Nessun file ricevuto" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const upload_url = await client.files.upload(buffer);

    return NextResponse.json({ upload_url });
  } catch (err) {
    console.error("Errore upload:", err);
    return NextResponse.json({ error: "Upload fallito" }, { status: 500 });
  }
}
