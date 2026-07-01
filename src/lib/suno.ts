import type { MusicJob, MusicStatus, MusicTrack, SongDraft } from "./types";

/**
 * Adapter para geracao de musica via Suno.
 *
 * O Suno nao possui API oficial publica, entao este adapter fala com um
 * provedor compativel (por padrao, o contrato do sunoapi.org / apibox, que e
 * o mais difundido). Ajuste SUNO_API_BASE_URL / SUNO_API_KEY / SUNO_MODEL no
 * ambiente. Se preferir outro provedor, os pontos de ajuste estao isolados
 * em `createRemoteJob` e `fetchRemoteJob`.
 *
 * Modo mock: sem SUNO_API_KEY (ou com SUNO_MOCK=1) o app funciona de ponta a
 * ponta com uma faixa de exemplo, util para desenvolvimento e demonstracao.
 */

const BASE_URL = (process.env.SUNO_API_BASE_URL || "https://api.sunoapi.org").replace(/\/$/, "");
const API_KEY = process.env.SUNO_API_KEY || "";
const MODEL = process.env.SUNO_MODEL || "V4";
const MOCK = process.env.SUNO_MOCK === "1" || !API_KEY;

export interface GenerateMusicInput {
  draft: SongDraft;
  /** Se true, gera sem vocais. */
  instrumental?: boolean;
}

/**
 * Cria uma tarefa de geracao e retorna o id do job.
 */
export async function createMusicJob(input: GenerateMusicInput): Promise<string> {
  if (MOCK) return createMockJob(input);
  return createRemoteJob(input);
}

/**
 * Consulta o status/resultado de um job.
 */
export async function getMusicJob(jobId: string): Promise<MusicJob> {
  if (MOCK || jobId.startsWith("mock_")) return getMockJob(jobId);
  return fetchRemoteJob(jobId);
}

/* ------------------------------------------------------------------ */
/* Provedor remoto (contrato sunoapi.org)                             */
/* ------------------------------------------------------------------ */

async function createRemoteJob(input: GenerateMusicInput): Promise<string> {
  const { draft, instrumental } = input;
  const res = await fetch(`${BASE_URL}/api/v1/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      // customMode = usamos nossa propria letra e estilo.
      customMode: true,
      instrumental: Boolean(instrumental),
      prompt: instrumental ? "" : draft.lyrics,
      style: draft.stylePrompt,
      title: draft.title,
      model: MODEL,
    }),
  });

  const data = await safeJson(res);
  if (!res.ok || (data?.code && data.code !== 200)) {
    throw new Error(`Suno: falha ao criar tarefa (${res.status}) ${data?.msg ?? ""}`.trim());
  }
  const taskId = data?.data?.taskId ?? data?.data?.task_id ?? data?.taskId;
  if (!taskId) throw new Error("Suno: resposta sem taskId.");
  return String(taskId);
}

async function fetchRemoteJob(jobId: string): Promise<MusicJob> {
  const url = `${BASE_URL}/api/v1/generate/record-info?taskId=${encodeURIComponent(jobId)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${API_KEY}` },
    cache: "no-store",
  });

  const data = await safeJson(res);
  if (!res.ok) {
    throw new Error(`Suno: falha ao consultar status (${res.status}) ${data?.msg ?? ""}`.trim());
  }

  const payload = data?.data ?? {};
  const status = normalizeStatus(payload.status);
  const sunoData: any[] =
    payload?.response?.sunoData ?? payload?.response?.data ?? payload?.sunoData ?? [];

  const tracks: MusicTrack[] = sunoData.map((t) => ({
    id: String(t.id),
    title: t.title ?? "",
    audioUrl: t.audioUrl ?? t.audio_url ?? t.streamAudioUrl ?? null,
    imageUrl: t.imageUrl ?? t.image_url ?? null,
    duration: typeof t.duration === "number" ? t.duration : null,
    status,
  }));

  return {
    jobId,
    status,
    tracks,
    error: status === "failed" ? payload?.errorMessage ?? "Falha na geracao." : undefined,
  };
}

/**
 * Normaliza os varios rotulos de status do provedor para os nossos.
 */
function normalizeStatus(raw?: string): MusicStatus {
  const s = (raw || "").toUpperCase();
  if (["SUCCESS", "COMPLETE", "COMPLETED"].includes(s)) return "complete";
  if (s.includes("FAIL") || s.includes("ERROR") || s.includes("SENSITIVE")) return "failed";
  if (["PENDING", "QUEUED", "CREATE_TASK"].some((k) => s.includes(k))) return "queued";
  // TEXT_SUCCESS, FIRST_SUCCESS, PROCESSING, etc.
  return "processing";
}

async function safeJson(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Modo mock                                                          */
/* ------------------------------------------------------------------ */

interface MockRecord {
  createdAt: number;
  input: GenerateMusicInput;
}

// Estado em memoria (suficiente para dev; em serverless reinicia por instancia).
const mockJobs = new Map<string, MockRecord>();

function createMockJob(input: GenerateMusicInput): string {
  const id = `mock_${Math.random().toString(36).slice(2, 10)}`;
  mockJobs.set(id, { createdAt: Date.now(), input });
  return id;
}

const SAMPLE_AUDIO =
  "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=lofi-study-112191.mp3";

function getMockJob(jobId: string): MusicJob {
  const rec = mockJobs.get(jobId);
  // Simula progressao: <4s queued, <8s processing, depois complete.
  const elapsed = rec ? Date.now() - rec.createdAt : 9000;
  let status: MusicStatus = "complete";
  if (elapsed < 4000) status = "queued";
  else if (elapsed < 8000) status = "processing";

  const title = rec?.input.draft.title || "Sua musica (demo)";
  const tracks: MusicTrack[] =
    status === "complete"
      ? [1, 2].map((n) => ({
          id: `${jobId}_${n}`,
          title: `${title} (v${n})`,
          audioUrl: SAMPLE_AUDIO,
          imageUrl: null,
          duration: 112,
          status,
        }))
      : [];

  return { jobId, status, tracks };
}

export const isMockMode = MOCK;
