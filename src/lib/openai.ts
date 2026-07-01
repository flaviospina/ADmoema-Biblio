import OpenAI from "openai";
import { SongDraftSchema, type Briefing, type SongDraft } from "./types";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompt";

/**
 * Cliente OpenAI. A chave vem de OPENAI_API_KEY. O modelo pode ser
 * sobrescrito por OPENAI_MODEL (default: gpt-4o).
 */
function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY nao configurada. Defina em .env.local (veja .env.example)."
    );
  }
  return new OpenAI({ apiKey });
}

const MODEL = process.env.OPENAI_MODEL || "gpt-4o";

/**
 * Gera a letra + prompt de estilo a partir do briefing do usuario.
 */
export async function generateSongDraft(briefing: Briefing): Promise<SongDraft> {
  const client = getClient();

  const completion = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.9,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(briefing) },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("A IA nao retornou conteudo. Tente novamente.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Resposta da IA em formato invalido (JSON).");
  }

  const result = SongDraftSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      "A IA retornou campos inesperados: " + result.error.issues.map((i) => i.path.join(".")).join(", ")
    );
  }

  // Garante o limite de 200 caracteres do Suno para o prompt de estilo.
  const draft = result.data;
  if (draft.stylePrompt.length > 200) {
    draft.stylePrompt = draft.stylePrompt.slice(0, 200).trim();
  }
  return draft;
}
