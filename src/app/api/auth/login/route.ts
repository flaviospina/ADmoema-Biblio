import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { attachSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

const Schema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail invalido."),
  password: z.string().min(1, "Informe a senha."),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo invalido." }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  // Mensagem generica para nao revelar existencia do e-mail.
  const invalid = NextResponse.json({ error: "E-mail ou senha invalidos." }, { status: 401 });
  if (!user) return invalid;
  if (!user.active) {
    return NextResponse.json({ error: "Conta desativada. Fale com um administrador." }, { status: 403 });
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return invalid;

  const res = NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
  return attachSessionCookie(res, {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
}
