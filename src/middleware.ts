import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, verifySession } from "@/lib/jwt";

/**
 * Protege rotas. Paginas sem sessao redirecionam para /login; chamadas de API
 * respondem 401 JSON. Rotas /admin exigem papel ADMIN.
 */

const PUBLIC_PATHS = new Set(["/login", "/register"]);
const PUBLIC_PREFIXES = ["/s/", "/api/auth/"];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;
  const isApi = pathname.startsWith("/api");

  // Ja logado tentando acessar login/registro -> vai pro app.
  if (session && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (isPublic(pathname)) return NextResponse.next();

  // Nao autenticado.
  if (!session) {
    if (isApi) {
      return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
    }
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Area administrativa exige ADMIN.
  const adminArea = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (adminArea && session.role !== "ADMIN") {
    if (isApi) {
      return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Tudo, exceto assets estaticos do Next e arquivos com extensao.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|mp3|css|js)).*)",
  ],
};
