import { NextRequest, NextResponse } from "next/server";
import { BriefingSchema } from "@/lib/types";
import { generateSongDraft } from "@/lib/openai";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo invalido." }, { status: 400 });
  }

  const parsed = BriefingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados invalidos." },
      { status: 400 }
    );
  }

  try {
    const draft = await generateSongDraft(parsed.data);
    return NextResponse.json({ draft });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao gerar a letra.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
