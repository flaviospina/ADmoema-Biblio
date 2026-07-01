import { SignJWT, jwtVerify } from "jose";

/**
 * Funcoes de token, seguras para edge (usadas tambem no middleware).
 * NAO importe next/headers ou o Prisma aqui.
 */

export const COOKIE_NAME = "hm_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

export interface SessionPayload {
  sub: string; // userId
  email: string;
  name: string;
  role: string; // USER | ADMIN
}

const DEV_FALLBACK = "dev-insecure-secret-change-me";

function secretKey(): Uint8Array {
  const s = process.env.AUTH_SECRET || DEV_FALLBACK;
  if (s === DEV_FALLBACK && process.env.NODE_ENV === "production") {
    console.warn("[auth] AUTH_SECRET nao definida em producao — defina uma chave forte!");
  }
  return new TextEncoder().encode(s);
}

export async function signSession(p: SessionPayload): Promise<string> {
  return new SignJWT({ email: p.email, name: p.name, role: p.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(p.sub)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.sub) return null;
    return {
      sub: String(payload.sub),
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
      role: String(payload.role ?? "USER"),
    };
  } catch {
    return null;
  }
}
