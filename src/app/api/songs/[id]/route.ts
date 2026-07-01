import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { refreshSong, serializeSong } from "@/lib/songs";

export const runtime = "nodejs";

async function loadOwned(id: string, userId: string, isAdmin: boolean) {
  const song = await prisma.song.findUnique({ where: { id }, select: { userId: true } });
  if (!song) return { error: "Musica nao encontrada.", status: 404 as const };
  if (song.userId !== userId && !isAdmin) return { error: "Sem permissao.", status: 403 as const };
  return { ok: true as const };
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  const guard = await loadOwned(params.id, session.sub, session.role === "ADMIN");
  if ("error" in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

  const song = await refreshSong(params.id);
  if (!song) return NextResponse.json({ error: "Musica nao encontrada." }, { status: 404 });

  return NextResponse.json({ song: serializeSong(song) });
}

const PatchSchema = z.object({ isPublic: z.boolean() });

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  const guard = await loadOwned(params.id, session.sub, session.role === "ADMIN");
  if ("error" in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo invalido." }, { status: 400 });
  }
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados invalidos." }, { status: 400 });

  const current = await prisma.song.findUnique({ where: { id: params.id }, select: { shareId: true } });
  const shareId =
    parsed.data.isPublic && !current?.shareId ? randomBytes(8).toString("hex") : current?.shareId;

  const updated = await prisma.song.update({
    where: { id: params.id },
    data: { isPublic: parsed.data.isPublic, shareId },
    select: { isPublic: true, shareId: true },
  });

  return NextResponse.json({ isPublic: updated.isPublic, shareId: updated.shareId });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  const guard = await loadOwned(params.id, session.sub, session.role === "ADMIN");
  if ("error" in guard) return NextResponse.json({ error: guard.error }, { status: guard.status });

  await prisma.song.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
