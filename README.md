# Historia em Musica 🎵

WebApp que transforma a **historia do usuario** em uma **musica pronta**.
A partir de uma narrativa e de algumas preferencias (genero, voz, instrumentos,
andamento, arranjo), a IA escreve a **letra com as marcacoes do Suno** e um
**prompt de estilo** otimizado, e depois gera a **musica final** via API do Suno.

Automatiza o fluxo que hoje e feito a mao (ChatGPT para a letra -> copiar/colar
no Suno -> escolher estilo/instrumentos/voz), com **contas de usuario**,
**historico de musicas**, **area administrativa** e **links publicos de
compartilhamento** (para presentear alguem com a musica dedicada).

> Este projeto vive na branch `claude/story-to-music-webapp-bxo8bn` do repo
> `ADmoema-Biblio`. A `main` permanece com o conteudo original.

## Como funciona

1. **Historia** — o usuario conta a historia e escolhe estilo, voz, instrumentos, etc.
2. **Letra** — a OpenAI gera titulo, letra (`[Verse]/[Chorus]/[Bridge]...`) e o
   prompt de estilo (<= 200 caracteres). O usuario pode editar tudo.
3. **Musica** — a letra + estilo vao para o Suno, que gera a musica. O app faz
   polling do status e exibe o player com opcao de download.
4. **Historico** — cada musica fica salva na conta do usuario.
5. **Compartilhar** — o usuario pode gerar um link publico (`/s/...`) para
   presentear alguem.

## Diferenciais

- Entrada por **historia narrativa** (nao so uma ideia curta), em portugues.
- Saida **estruturada e pronta pro Suno**: letra com marcacoes + estilo <=200ch.
- **Contas + historico** de todas as musicas geradas.
- **Links de compartilhamento** para presentear (ideal para homenagens).
- **Painel administrativo** com estatisticas e gestao de usuarios.

## Stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS**
- **OpenAI SDK** (letra + estilo)
- Adapter de **Suno** configuravel (contrato `sunoapi.org` por padrao) + modo mock
- **Prisma** (SQLite por padrao; trocavel para Postgres)
- Autenticacao propria: **bcryptjs** (hash de senha) + **jose** (JWT em cookie httpOnly)
- **Zod** para validacao

## Rodando localmente

```bash
npm install                  # instala deps e gera o Prisma Client (postinstall)
cp .env.example .env.local   # preencha AUTH_SECRET, OPENAI_API_KEY, etc.
npm run db:push              # cria o banco a partir do schema
npm run dev                  # http://localhost:3000
```

O **primeiro usuario** que se cadastrar vira **ADMIN** automaticamente
(ou informe e-mails em `ADMIN_EMAILS`).

### Modo mock (sem chaves)

Sem `SUNO_API_KEY`, o app entra em **modo mock** e usa uma faixa de exemplo,
permitindo testar todo o fluxo. Para a geracao real da musica, informe a chave.
A geracao da letra exige `OPENAI_API_KEY` real.

## Variaveis de ambiente

| Variavel             | Obrigatoria | Descricao                                             |
| -------------------- | ----------- | ----------------------------------------------------- |
| `DATABASE_URL`       | sim         | Conexao do banco (default SQLite `file:./dev.db`).    |
| `AUTH_SECRET`        | sim         | Chave para assinar os tokens de sessao (JWT).         |
| `ADMIN_EMAILS`       | nao         | E-mails que viram ADMIN ao se cadastrar (virgula).    |
| `OPENAI_API_KEY`     | sim         | Chave da OpenAI para gerar a letra e o estilo.        |
| `OPENAI_MODEL`       | nao         | Modelo (default `gpt-4o`).                            |
| `SUNO_API_KEY`       | nao*        | Chave do provedor de API do Suno. Sem ela, usa mock.  |
| `SUNO_API_BASE_URL`  | nao         | URL base do provedor (default `https://api.sunoapi.org`). |
| `SUNO_MODEL`         | nao         | Versao do Suno (`V3_5`, `V4`, `V4_5`...).             |
| `SUNO_MOCK`          | nao         | `1` forca o modo mock.                                |

\* Necessaria para gerar musica de verdade.

Gere um `AUTH_SECRET` forte com: `openssl rand -base64 32`.

## Banco de dados

Prisma com **SQLite** por padrao (arquivo `prisma/dev.db`, zero-config). Para
**Postgres**, troque `provider` para `postgresql` em `prisma/schema.prisma` e
ajuste `DATABASE_URL`. Comandos uteis:

```bash
npm run db:push     # aplica o schema no banco
npm run db:studio   # abre o Prisma Studio
```

Modelos: `User` (com papel USER/ADMIN), `Song` (letra, estilo, status, share),
`Track` (faixas de audio geradas).

## Sobre a API do Suno

O Suno **nao possui API oficial publica**. Este projeto fala com um provedor
compativel (o contrato do `sunoapi.org` / apibox e o mais comum). Se voce usar
outro provedor, os unicos pontos a ajustar sao `createRemoteJob` e
`fetchRemoteJob` em [`src/lib/suno.ts`](src/lib/suno.ts).

## Estrutura

```
prisma/schema.prisma        User, Song, Track
src/
  middleware.ts             protecao de rotas + area admin
  app/
    (auth)/login|register   paginas publicas de conta
    (app)/                  area logada (layout com sessao)
      page.tsx              criador (historia -> letra -> musica)
      historico/            lista de musicas do usuario
      musica/[id]/          detalhe + compartilhar + excluir
      admin/                painel, usuarios, todas as musicas
    s/[shareId]/            pagina publica de compartilhamento
    api/
      auth/                 register, login, logout, me
      generate-lyrics/      letra + estilo (OpenAI)
      generate-music/       cria a musica + persiste (Suno)
      songs/ , songs/[id]/  historico e status/compartilhar/excluir
      admin/users/          gestao de usuarios
  components/               UI (StoryForm, LyricsEditor, MusicPlayer, AppShell...)
  lib/
    db.ts       cliente Prisma (singleton)
    auth.ts     sessao (cookies) + guardas
    jwt.ts      assinatura/verificacao de token (edge-safe)
    password.ts hash/verify de senha
    openai.ts   integracao OpenAI
    suno.ts     adapter Suno (+ modo mock)
    songs.ts    refresh/persistencia de musicas
    prompt.ts   system prompt / briefing
    catalog.ts  generos, instrumentos, vozes...
    types.ts    tipos + schemas Zod
```

## Roadmap

- [x] Contas de usuario e historico de musicas
- [x] Area administrativa
- [x] Compartilhamento publico de musicas
- [ ] Biblioteca de estilos salvos / favoritos
- [ ] Regeneracao de trechos especificos da letra
- [ ] Escolha de multiplos provedores de IA (Claude/OpenAI)
- [ ] Upload das musicas para storage proprio (hoje usa a URL do Suno)
- [ ] Recuperacao de senha por e-mail
