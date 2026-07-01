import { NextRequest, NextResponse } from "next/server";
import { getMusicJob } from "@/lib/suno";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get("jobId");
  if (!jobId) {
    return NextResponse.json({ error: "jobId ausente." }, { status: 400 });
  }

  try {
    const job = await getMusicJob(jobId);
    return NextResponse.json({ job });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao consultar status.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
