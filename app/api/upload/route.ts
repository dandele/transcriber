import { AssemblyAI } from "assemblyai";
import { NextRequest, NextResponse } from "next/server";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffmpeg from "fluent-ffmpeg";
import { writeFile, readFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";

export const maxDuration = 60;

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const client = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY! });

function convertToMp3(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioCodec("libmp3lame")
      .audioFrequency(16000)
      .audioChannels(1)
      .audioBitrate("64k")
      .toFormat("mp3")
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .save(outputPath);
  });
}

export async function POST(req: NextRequest) {
  const tmpIn = join(tmpdir(), `${randomUUID()}_input`);
  const tmpOut = join(tmpdir(), `${randomUUID()}.mp3`);

  try {
    const formData = await req.formData();
    const file = formData.get("audio") as File;

    if (!file) {
      return NextResponse.json({ error: "Nessun file ricevuto" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    await writeFile(tmpIn, Buffer.from(arrayBuffer));

    await convertToMp3(tmpIn, tmpOut);

    const mp3Buffer = await readFile(tmpOut);
    const upload_url = await client.files.upload(mp3Buffer);

    return NextResponse.json({ upload_url });
  } catch (err) {
    console.error("Errore upload/conversione:", err);
    return NextResponse.json({ error: "Errore durante la conversione del file" }, { status: 500 });
  } finally {
    await unlink(tmpIn).catch(() => {});
    await unlink(tmpOut).catch(() => {});
  }
}
