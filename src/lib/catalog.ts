import type { VoiceType, Tempo } from "./types";

/**
 * Catalogos usados para preencher os seletores da UI. Nao sao exaustivos:
 * o usuario tambem pode digitar valores livres, e a IA aceita qualquer texto.
 */

export const GENRES: string[] = [
  "MPB",
  "Sertanejo",
  "Gospel / Louvor",
  "Pop",
  "Rock",
  "Samba",
  "Pagode",
  "Forro",
  "Bossa Nova",
  "Country",
  "Folk / Acustico",
  "Rap / Hip-Hop",
  "Reggae",
  "Eletronica",
  "Balada romantica",
  "Infantil",
  "Trilha epica / Orquestral",
];

export const INSTRUMENTS: string[] = [
  "Violao",
  "Guitarra",
  "Piano",
  "Teclado",
  "Baixo",
  "Bateria",
  "Percussao",
  "Cordas / Orquestra",
  "Violino",
  "Violoncelo",
  "Sax",
  "Trompete",
  "Flauta",
  "Sanfona / Acordeon",
  "Cavaquinho",
  "Viola caipira",
  "Sintetizadores",
  "Coro / Backing vocals",
];

export const MOODS: string[] = [
  "Emocionante",
  "Alegre",
  "Nostalgico",
  "Romantico",
  "Esperancoso",
  "Melancolico",
  "Triunfante",
  "Reflexivo",
  "Festivo",
  "Intimo",
];

export const VOICE_LABELS: Record<VoiceType, string> = {
  masculina: "Voz masculina",
  feminina: "Voz feminina",
  dueto: "Dueto (masc. + fem.)",
  coral: "Coral",
  infantil: "Voz infantil",
  instrumental: "Instrumental (sem voz)",
};

export const TEMPO_LABELS: Record<Tempo, string> = {
  lenta: "Lenta",
  moderada: "Moderada",
  animada: "Animada",
  intensa: "Intensa",
};

export const LANGUAGES: string[] = [
  "Portugues (Brasil)",
  "Portugues (Portugal)",
  "Ingles",
  "Espanhol",
  "Italiano",
];
