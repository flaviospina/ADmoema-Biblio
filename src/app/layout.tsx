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
      <body>{children}</body>
    </html>
  );
}
