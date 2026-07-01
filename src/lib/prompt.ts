import { VOICE_LABELS, TEMPO_LABELS } from "./catalog";
import type { Briefing } from "./types";

/**
 * Instrucoes de sistema para o modelo. Reproduz o "briefing" que o usuario
 * faz hoje manualmente no ChatGPT: transformar uma historia em uma letra
 * pronta pro Suno, com marcacoes de estrutura e um prompt de estilo.
 */
export const SYSTEM_PROMPT = `Voce e um compositor e produtor musical especialista em criar letras
prontas para a plataforma Suno AI. A partir da HISTORIA e das PREFERENCIAS
do usuario, voce escreve uma letra original, emocionante e coerente com a
narrativa, alem de um prompt de estilo otimizado para o Suno.

Regras da letra:
- Escreva no idioma pedido.
- Use as marcacoes de estrutura do Suno, sempre entre colchetes e em ingles:
  [Intro], [Verse], [Pre-Chorus], [Chorus], [Bridge], [Outro].
- Um refrao ([Chorus]) memoravel que sintetize a emocao central da historia.
- Fidelidade a historia: nomes, lugares e fatos citados devem aparecer.
- Nada de clichês genericos vazios; prefira imagens concretas da historia.
- Se for "instrumental", escreva apenas as marcacoes de estrutura e uma breve
  descricao entre parenteses, sem versos cantados.

Regras do prompt de estilo (campo stylePrompt):
- No maximo 200 caracteres.
- Formato: genero, tipo de voz, instrumentos-chave, clima/andamento,
  separados por virgula, em ingles ou no idioma do genero. Sem letra dentro dele.
- Traduza o tipo de voz para termos que o Suno entende (male vocals, female
  vocals, duet, choir, children's choir, instrumental).

Responda SEMPRE em JSON valido com exatamente estas chaves:
{
  "title": string,
  "lyrics": string,
  "stylePrompt": string,
  "tags": string[],
  "notes": string
}
Nao inclua texto fora do JSON.`;

/**
 * Monta a mensagem do usuario a partir do briefing estruturado.
 */
export function buildUserPrompt(b: Briefing): string {
  const lines: string[] = [];
  lines.push("HISTORIA:");
  lines.push(b.story.trim());
  lines.push("");
  lines.push("PREFERENCIAS:");
  lines.push(`- Idioma da letra: ${b.language}`);
  lines.push(`- Tipo de voz: ${VOICE_LABELS[b.voiceType]}`);
  lines.push(`- Andamento: ${TEMPO_LABELS[b.tempo]}`);
  if (b.genre) lines.push(`- Genero/estilo: ${b.genre}`);
  if (b.mood) lines.push(`- Clima/emocao: ${b.mood}`);
  if (b.instruments.length) lines.push(`- Instrumentos: ${b.instruments.join(", ")}`);
  if (b.arrangement) lines.push(`- Arranjo/observacoes: ${b.arrangement}`);
  if (b.dedicatedTo) lines.push(`- Dedicada a: ${b.dedicatedTo}`);
  if (b.title) lines.push(`- Titulo desejado: ${b.title}`);
  else lines.push("- Titulo: sugira um titulo curto e marcante.");
  return lines.join("\n");
}
