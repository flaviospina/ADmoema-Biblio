import { z } from "zod";

/**
 * Tipo de voz principal da musica.
 */
export const VOICE_TYPES = [
  "masculina",
  "feminina",
  "dueto",
  "coral",
  "infantil",
  "instrumental",
] as const;
export type VoiceType = (typeof VOICE_TYPES)[number];

/**
 * Andamento / energia geral.
 */
export const TEMPOS = ["lenta", "moderada", "animada", "intensa"] as const;
export type Tempo = (typeof TEMPOS)[number];

/**
 * Preferencias que o usuario informa junto com a historia. Todas opcionais
 * exceto a propria historia; quando vazias, a IA decide o melhor caminho.
 */
export const BriefingSchema = z.object({
  /** A historia narrada pelo usuario (nucleo do app). */
  story: z.string().min(20, "Conte um pouco mais da sua historia (min. 20 caracteres)."),
  /** Idioma da letra. */
  language: z.string().default("Portugues (Brasil)"),
  /** Genero / estilo musical (ex.: "MPB", "sertanejo", "gospel", "rock"). */
  genre: z.string().optional().default(""),
  /** Clima / emocao (ex.: "emocionante", "alegre", "nostalgico"). */
  mood: z.string().optional().default(""),
  /** Tipo de voz principal. */
  voiceType: z.enum(VOICE_TYPES).default("feminina"),
  /** Instrumentos desejados. */
  instruments: z.array(z.string()).default([]),
  /** Andamento. */
  tempo: z.enum(TEMPOS).default("moderada"),
  /** Observacoes de arranjo (ex.: "solo de violao na ponte", "crescendo no final"). */
  arrangement: z.string().optional().default(""),
  /** Nome ou pessoa homenageada, para personalizar a letra. */
  dedicatedTo: z.string().optional().default(""),
  /** Titulo desejado (opcional; a IA sugere se vazio). */
  title: z.string().optional().default(""),
});
export type Briefing = z.infer<typeof BriefingSchema>;

/**
 * Resultado da geracao de letra pela IA. Pronto para o Suno.
 */
export const SongDraftSchema = z.object({
  /** Titulo da musica. */
  title: z.string(),
  /** Letra completa com marcacoes [Verse]/[Chorus]/[Bridge]. */
  lyrics: z.string(),
  /**
   * Prompt de estilo curto (<= 200 caracteres) no formato que o Suno espera:
   * genero, voz, instrumentos e clima separados por virgula.
   */
  stylePrompt: z.string(),
  /** Tags/metadados legiveis para a UI. */
  tags: z.array(z.string()).default([]),
  /** Explicacao curta das escolhas criativas. */
  notes: z.string().default(""),
});
export type SongDraft = z.infer<typeof SongDraftSchema>;

/**
 * Estados possiveis de uma geracao de musica no Suno.
 */
export type MusicStatus = "queued" | "processing" | "complete" | "failed";

/**
 * Uma faixa gerada pelo Suno.
 */
export interface MusicTrack {
  id: string;
  title: string;
  audioUrl: string | null;
  imageUrl: string | null;
  duration: number | null;
  status: MusicStatus;
}

/**
 * Resposta agregada do polling de status.
 */
export interface MusicJob {
  jobId: string;
  status: MusicStatus;
  tracks: MusicTrack[];
  error?: string;
}
