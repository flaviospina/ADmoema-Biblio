import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { getMusicJob } from "./suno";

const TERMINAL = new Set(["complete", "failed"]);

export type SongWithTracks = Prisma.SongGetPayload<{ include: { tracks: true } }>;

/**
 * Consulta o Suno para musicas ainda em andamento, persiste as faixas quando
 * ficam prontas e atualiza o status. Idempotente e tolerante a falhas
 * transitorias (mantem o estado atual em caso de erro).
 */
export async function refreshSong(songId: string): Promise<SongWithTracks | null> {
  const song = await prisma.song.findUnique({
    where: { id: songId },
    include: { tracks: true },
  });
  if (!song) return null;
  if (TERMINAL.has(song.status) || !song.sunoJobId) return song;

  let job;
  try {
    job = await getMusicJob(song.sunoJobId);
  } catch {
    return song;
  }

  if (job.status === "complete" && song.tracks.length === 0 && job.tracks.length > 0) {
    await prisma.track.createMany({
      data: job.tracks.map((t) => ({
        songId: song.id,
        extId: t.id,
        title: t.title,
        audioUrl: t.audioUrl,
        imageUrl: t.imageUrl,
        duration: t.duration ?? null,
      })),
    });
  }

  if (job.status !== song.status) {
    await prisma.song.update({ where: { id: song.id }, data: { status: job.status } });
  }

  return prisma.song.findUnique({ where: { id: song.id }, include: { tracks: true } });
}

function safeArray(json: string): string[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/**
 * Forma serializavel de uma musica para a API e paginas.
 */
export function serializeSong(song: SongWithTracks) {
  return {
    id: song.id,
    title: song.title,
    status: song.status,
    lyrics: song.lyrics,
    stylePrompt: song.stylePrompt,
    tags: safeArray(song.tags),
    notes: song.notes,
    instrumental: song.instrumental,
    isPublic: song.isPublic,
    shareId: song.shareId,
    createdAt: song.createdAt,
    tracks: song.tracks.map((t) => ({
      id: t.id,
      title: t.title,
      audioUrl: t.audioUrl,
      imageUrl: t.imageUrl,
      duration: t.duration,
      status: song.status,
    })),
  };
}
