# 🎼 Coral ADMoema — Cantata · Ensaio Inteligente

Sistema web para gestão do coral e **treino vocal com análise de afinação em tempo real**.
Referência: a página atual da [Cantata ADMoema](https://admoema.com.br/cantata/) — este
projeto vai além, transformando o coralista em protagonista do próprio ensaio em casa e
dando ao maestro indicadores para acompanhar cada naipe.

**Stack:** PHP 8+ (MVC próprio, sem dependências) · MySQL · URLs amigáveis (.htaccess) ·
frontend JS + Web Audio API — pronto para a hospedagem compartilhada da **HostGator**.

## ✨ Diferenciais

- 🎤 **Treino guiado por naipe** (soprano, contralto, tenor, baixo), com a linha de voz
  real de cada hino definida pelo maestro e **tolerância de oitava**.
- 👂 **Modo "Ouça e repita"** para quem não lê partitura + **"Seguir as notas"**.
- 🎚️ **Andamento ajustável** (Normal/Calmo/Lento), **contagem 3-2-1** e **nota-guia** 🎧.
- 📉 **Gráfico ao vivo da afinação** durante o exercício e **diagnóstico nota a nota**
  ("onde melhorar": agudo/grave e quantos cents).
- 📈 **Evolução do timbre e da afinação** por coralista; 📊 **painel do maestro** com
  relatórios de acesso (dia/semana/mês), ranking de dedicação e situação por naipe.
- 🔐 **Login com senha criptografada** (bcrypt) e sessões seguras; coralista vê só os
  próprios dados, maestro vê todos.
- 🔒 **Privacidade**: o áudio é processado 100% no navegador; a voz não sai do aparelho.

## 🚀 Publicação na HostGator

Guia completo passo a passo em **[`DEPLOY.md`](DEPLOY.md)** — resumo:
1. Crie o banco no cPanel (MySQL Databases) e importe **`database/schema.sql`** no phpMyAdmin.
2. Envie o **conteúdo de `public_html/`** para a `public_html` da hospedagem.
3. Copie `config.example.php` → **`config.php`** e preencha os dados do banco.
4. Acesse o site (HTTPS!) — maestro: `maestro@admoema.com.br` / `admoema123` (troque!).

## 🧱 Estrutura

```
public_html/              # tudo que sobe para a HostGator
  index.php               # front controller (rotas amigáveis)
  .htaccess               # rewrite + proteção de pastas
  config.example.php      # modelo de configuração do MySQL
  app/
    Core/                 # Router, Database (PDO), Auth (sessão+bcrypt), Controller
    Controllers/          # Auth, Hymn, Material, Session, Admin, Page
    Models/               # User, Hymn, VoiceLine, Material, PracticeSession, AccessLog
    Views/shell.php       # shell do aplicativo (o JS renderiza as telas)
  assets/                 # css/js (pitch.js = detecção de afinação; trainer.js = ensaio)
  uploads/                # arquivos de materiais (bloqueada; entrega via API)
database/schema.sql       # tabelas MySQL + dados iniciais (importar no phpMyAdmin)
dev/                      # utilitários de desenvolvimento local (SQLite)
```

### Rotas principais

| URL amigável | Tela |
|---|---|
| `/entrar` | Login / criar conta |
| `/inicio` · `/ensaiar` · `/evolucao` · `/materiais` | Área do coralista |
| `/painel` · `/painel/acessos` · `/painel/naipes` · `/painel/hinos` · `/painel/coralistas` · `/painel/materiais` | Área do maestro |
| `/api/...` | API JSON (sessão por cookie) |

## 🗺️ Roadmap

- [x] Etapa 1 — Fundação (auth bcrypt, papéis, ensaio com afinação em tempo real, painéis)
- [x] Etapa 2 — Melodia-alvo por naipe + ensaio guiado nota a nota
- [x] Layout claro (creme/verde) + responsivo com menu móvel
- [x] Migração PHP MVC + MySQL (HostGator) + URLs amigáveis + ensaio aprimorado
- [ ] Etapa 3 — Relatórios avançados (metas, frequência, alertas para o maestro)
- [ ] Etapa 4 — Biblioteca rica (áudios por naipe sincronizados ao ensaio)
- [ ] Etapa 5 — Polimento e integração com admoema.com.br
