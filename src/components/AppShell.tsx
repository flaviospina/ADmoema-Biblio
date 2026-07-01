"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface Props {
  name: string;
  role: string;
  children: React.ReactNode;
}

export function AppShell({ name, role, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const links: { href: string; label: string }[] = [
    { href: "/", label: "Criar" },
    { href: "/historico", label: "Historico" },
  ];
  if (role === "ADMIN") links.push({ href: "/admin", label: "Admin" });

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-lg font-extrabold text-transparent">
            Historia em Musica
          </Link>
          <nav className="flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition " +
                  (isActive(l.href)
                    ? "bg-brand-500/20 text-brand-100"
                    : "text-slate-300 hover:bg-white/5")
                }
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-400 sm:inline">Ola, {name.split(" ")[0]}</span>
            <button onClick={logout} className="text-sm text-slate-400 hover:text-slate-200">
              Sair
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:py-10">{children}</main>
    </div>
  );
}
