import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Historia em Musica",
  description:
    "Transforme a sua historia em uma musica pronta: letra, estilo, instrumentos e voz, com a musica gerada pela IA.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-8 sm:py-12">
          <header className="mb-8 text-center">
            <h1 className="bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl">
              Historia em Musica
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Conte a sua historia. A IA escreve a letra, define o estilo e gera a musica.
            </p>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="mt-12 text-center text-xs text-slate-600">
            Feito para transformar historias em cancoes.
          </footer>
        </div>
      </body>
    </html>
  );
}
