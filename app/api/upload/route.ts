export const runtime = "edge";
export const maxDuration = 30;

export async function POST(req: Request) {
  if (!req.body) {
    return Response.json({ error: "Nessun file ricevuto" }, { status: 400 });
  }

  const response = await fetch("https://api.assemblyai.com/v2/upload", {
    method: "POST",
    headers: {
      Authorization: process.env.ASSEMBLYAI_API_KEY!,
      "Content-Type": "application/octet-stream",
    },
    // @ts-expect-error duplex richiesto per streaming body
    duplex: "half",
    body: req.body,
  });

  if (!response.ok) {
    return Response.json({ error: "Upload verso AssemblyAI fallito" }, { status: 500 });
  }

  const { upload_url } = await response.json();
  return Response.json({ upload_url });
}
