# 🎼 Coral ADMoema — Cantata · Ensaio Inteligente

Sistema web para gestão do coral e **treino vocal com análise de afinação em tempo real**.
Referência de mercado: a página atual da [Cantata ADMoema](https://admoema.com.br/cantata/) —
este projeto vai além, transformando o coralista em protagonista do próprio ensaio em casa
e dando ao maestro indicadores para acompanhar cada naipe.

## ✨ O que torna este webapp diferente

A maioria das ferramentas do mercado (Pitch Detector, Vocal Pitch Monitor, Singing Carrots,
Vocal Range Test) faz apenas a **detecção de pitch isolada**. Aqui isso é só o começo: a
detecção é integrada à **gestão do coral**, ao **acompanhamento por naipe** e a um **painel
do maestro**, com histórico de evolução por coralista.

- 🎤 **Treino guiado por naipe** (soprano, contralto, tenor, baixo) — a faixa de oitava é
  fixada conforme o tipo de voz, evitando o "erro de oitava" dos detectores genéricos.
- 📈 **Evolução do timbre e da afinação** ao longo do tempo, por coralista.
- 📊 **Dashboard do maestro** com indicadores e relatórios de quem ensaia em casa.
- 🔐 **Login com senha criptografada** (bcrypt) e visão restrita por papel.
- 🔒 **Privacidade**: o áudio é processado 100% no navegador (Web Audio API); a voz não sai
  do dispositivo do coralista.

## 👥 Perfis de acesso

| Perfil | Acessa |
|--------|--------|
| **Coralista** | Apenas as **próprias** informações: ensaio de voz, evolução e materiais do seu naipe. |
| **Maestro (admin)** | **Todos** os coralistas: dashboard, relatórios de acesso, relatório por naipe, cadastro de coralistas e biblioteca de materiais. |

## 🚀 Como rodar

**Publicar online (link público, sem instalar nada):** veja o passo a passo em
[`DEPLOY.md`](DEPLOY.md) — deploy gratuito no Render com HTTPS (necessário para o microfone).

**Rodar localmente:**

```bash
cd server
npm install
npm start            # http://localhost:3000
```

> Requer **Node.js 22+** (usa o módulo nativo `node:sqlite`). O banco SQLite é criado
> automaticamente em `server/data/cantata.db`.

**Conta de teste do maestro** (criada no primeiro start):
`maestro@admoema.com.br` · senha `admoema123`

Coralistas podem se autocadastrar na tela inicial, ou serem cadastrados pelo maestro.

## 🧱 Arquitetura

```
server/                 # Backend Node.js + Express + SQLite (node:sqlite)
  src/db.js             # Esquema do banco e seed
  src/auth.js           # bcrypt (senha criptografada) + JWT + middlewares de papel
  src/server.js         # API REST + serve o frontend
client/                 # Frontend (HTML + JS modular + Chart.js)
  js/pitch.js           # Motor de detecção de afinação (autocorrelação, Web Audio)
  js/trainer.js         # Tela de ensaio de voz do coralista
  js/app.js             # Roteador + telas (login, coralista, maestro)
```

### Principais endpoints

| Método | Rota | Acesso |
|--------|------|--------|
| POST | `/api/auth/register` · `/api/auth/login` | público |
| GET | `/api/me` | autenticado |
| GET | `/api/hymns` · POST (maestro) | criar hino |
| GET/PUT | `/api/hymns/:id/voice-lines` | melodia por naipe (PUT: maestro) |
| POST/GET | `/api/sessions` · `/api/sessions/mine` | coralista |
| GET/POST | `/api/materials` | ver: todos · criar: maestro |
| GET | `/api/admin/dashboard` | maestro |
| GET | `/api/admin/access-report?period=day\|week\|month` | maestro |
| GET | `/api/admin/voice-report` | maestro |
| GET/POST | `/api/admin/coralistas` | maestro |

## 🗺️ Roadmap (entrega por etapas)

- [x] **Etapa 1 — Fundação**: autenticação criptografada + papéis,
  banco de dados, ferramenta de ensaio de voz com afinação em tempo real, dashboards
  navegáveis, gráficos de evolução, relatórios de acesso/naipe e biblioteca de materiais.
- [x] **Etapa 2 — Melodia-alvo por naipe** *(esta entrega)*: o maestro define a linha de
  voz real de cada naipe em cada hino (`Hinos & melodias`); o ensaio do coralista passa a
  seguir essa melodia nota a nota, com destaque da nota atual, pontuação por acerto
  (`x/n notas no tom`) e botão **🔊 Ouvir melodia** (tom de referência). Inclui editor de
  hinos (título/tom/BPM) e linhas de voz por naipe.
- [ ] **Etapa 3** — Relatórios avançados (metas, frequência de ensaio, alertas para o maestro).
- [ ] **Etapa 4** — Biblioteca rica (áudios por naipe, sincronização letra/cifra com o ensaio).
- [ ] **Etapa 5** — Polimento, deploy e integração com admoema.com.br.

## 🔬 Pesquisa de mercado (timbres soprano · contralto · tenor · baixo)

Ferramentas analisadas como referência de detecção de voz em navegador:
Pitch Detector (pitch-detector.com), Vocal Pitch Monitor, Singing Carrots Voice Tuner,
Vocal Range Test e Vocal Range Calculator. Todas processam o áudio localmente e usam
seleção de tipo de voz para acertar a oitava — abordagem adotada e ampliada aqui.
