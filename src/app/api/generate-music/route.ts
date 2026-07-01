import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SongDraftSchema } from "@/lib/types";
import { createMusicJob } from "@/lib/suno";

export const runtime = "nodejs";
export const maxDuration = 60;

const BodySchema = z.object({
  draft: SongDraftSchema,
  instrumental: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo invalido." }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Rascunho da musica invalido." }, { status: 400 });
  }

  try {
    const jobId = await createMusicJob({
      draft: parsed.data.draft,
      instrumental: parsed.data.instrumental,
    });
    return NextResponse.json({ jobId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao iniciar a geracao.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
