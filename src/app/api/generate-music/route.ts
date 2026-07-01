import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SongDraftSchema } from "@/lib/types";
import { createMusicJob } from "@/lib/suno";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

const BodySchema = z.object({
  draft: SongDraftSchema,
  instrumental: z.boolean().optional().default(false),
  briefing: z.record(z.any()).optional(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

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
  const { draft, instrumental, briefing } = parsed.data;

  try {
    const jobId = await createMusicJob({ draft, instrumental });

    const song = await prisma.song.create({
      data: {
        userId: session.sub,
        title: draft.title,
        story: typeof briefing?.story === "string" ? briefing.story : "",
        briefing: JSON.stringify(briefing ?? {}),
        lyrics: draft.lyrics,
        stylePrompt: draft.stylePrompt,
        tags: JSON.stringify(draft.tags ?? []),
        notes: draft.notes ?? "",
        instrumental,
        sunoJobId: jobId,
        status: "queued",
      },
    });

    return NextResponse.json({ songId: song.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao iniciar a geracao.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
