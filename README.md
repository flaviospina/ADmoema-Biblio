# Historia em Musica 🎵

WebApp que transforma a **historia do usuario** em uma **musica pronta**.
A partir de uma narrativa e de algumas preferencias (genero, voz, instrumentos,
andamento, arranjo), a IA escreve a **letra com as marcacoes do Suno** e um
**prompt de estilo** otimizado, e depois gera a **musica final** via API do Suno.

Automatiza o fluxo que hoje e feito a mao (ChatGPT para a letra -> copiar/colar
no Suno -> escolher estilo/instrumentos/voz).

> Este projeto nasceu na branch `claude/story-to-music-webapp-bxo8bn` do repo
> `ADmoema-Biblio`. A `main` permanece com o conteudo original.

## Como funciona

1. **Historia** — o usuario conta a historia e escolhe estilo, voz, instrumentos, etc.
2. **Letra** — a OpenAI gera titulo, letra (`[Verse]/[Chorus]/[Bridge]...`) e o
   prompt de estilo (<= 200 caracteres). O usuario pode editar tudo.
3. **Musica** — a letra + estilo vao para o Suno, que gera a musica. O app faz
   polling do status e exibe o player com opcao de download.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** para a UI
- **OpenAI SDK** (letra + estilo)
- Adapter de **Suno** configuravel (contrato `sunoapi.org` por padrao)
- **Zod** para validacao

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha as chaves
npm run dev                  # http://localhost:3000
```

### Modo mock (sem chaves)

Sem `SUNO_API_KEY`, o app entra em **modo mock** e usa uma faixa de exemplo,
permitindo testar todo o fluxo. Para a geracao real da musica, informe a chave.
A letra ainda exige `OPENAI_API_KEY` real.

## Variaveis de ambiente

| Variavel             | Obrigatoria | Descricao                                             |
| -------------------- | ----------- | ----------------------------------------------------- |
| `OPENAI_API_KEY`     | sim         | Chave da OpenAI para gerar a letra e o estilo.        |
| `OPENAI_MODEL`       | nao         | Modelo (default `gpt-4o`).                            |
| `SUNO_API_KEY`       | nao*        | Chave do provedor de API do Suno. Sem ela, usa mock.  |
| `SUNO_API_BASE_URL`  | nao         | URL base do provedor (default `https://api.sunoapi.org`). |
| `SUNO_MODEL`         | nao         | Versao do Suno (`V3_5`, `V4`, `V4_5`...).             |
| `SUNO_MOCK`          | nao         | `1` forca o modo mock.                                |

\* Necessaria para gerar musica de verdade.

## Sobre a API do Suno

O Suno **nao possui API oficial publica**. Este projeto fala com um provedor
compativel (o contrato do `sunoapi.org` / apibox e o mais comum). Se voce usar
outro provedor, os unicos pontos a ajustar sao `createRemoteJob` e
`fetchRemoteJob` em [`src/lib/suno.ts`](src/lib/suno.ts).

## Estrutura

```
src/
  app/
    api/
      generate-lyrics/   letra + estilo (OpenAI)
      generate-music/    inicia geracao (Suno)
      music-status/      polling do status
    layout.tsx  page.tsx  globals.css
  components/    StoryForm, LyricsEditor, MusicPlayer, Stepper
  lib/
    openai.ts    integracao OpenAI
    suno.ts      adapter Suno (+ modo mock)
    prompt.ts    system prompt / briefing
    catalog.ts   generos, instrumentos, vozes...
    types.ts     tipos + schemas Zod
```

## Roadmap

- [ ] Contas de usuario e historico de musicas
- [ ] Biblioteca de estilos salvos
- [ ] Regeneracao de trechos especificos da letra
- [ ] Escolha de multiplos provedores de IA (Claude/OpenAI)
- [ ] Persistencia das musicas (banco + storage)
