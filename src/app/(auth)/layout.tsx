export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
          Historia em Musica
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Sua historia vira musica: letra, estilo e cancao gerada pela IA.
        </p>
      </div>
      {children}
    </div>
  );
}
