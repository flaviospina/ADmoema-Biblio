# Roadmap — Ecossistema Digital AD Moema

> **Base**: [`docs/pesquisa-necessidades-igrejas-global.md`](./pesquisa-necessidades-igrejas-global.md)
> **Objetivo**: transformar os dois projetos já iniciados (biblioteca de livros e repositório de
> imagens) no ponto de partida de um ecossistema que atende as dores das igrejas — primeiro na
> AD Moema, depois replicável para outras congregações no Brasil e no mundo.
>
> **Data**: Julho de 2026 · **Horizonte**: ~18 meses (4 fases + evolução contínua)

---

## 1. Visão e princípios

**Visão**: um conjunto integrado e leve de ferramentas que ajuda a igreja a **gerir**, **comunicar**,
**discipular** e **alcançar** — usável em celular, funcionando com internet ruim, em português, e
replicável para outras igrejas.

**Princípios de engenharia (extraídos da pesquisa):**
1. **Mobile-first / offline-first** — o acesso móvel já supera o desktop; no Sul Global o celular é
   o único dispositivo.
2. **Modular** — cada peça funciona sozinha; a igreja adota só o que precisa (adoção +30% em
   igrejas pequenas com modelo modular).
3. **Localização real** — Pix no Brasil, mobile money na África; idioma e moeda locais.
4. **Base comum reutilizável** — identidade (login), dados de membros e mídia compartilhados entre
   módulos, para não reconstruir o cadastro em cada projeto.
5. **Tecnologia serve à missão** — nunca substitui comunhão e cuidado pastoral.

**Métrica-âncora de sucesso**: a AD Moema roda 100% da secretaria, finanças e comunicação no
ecossistema, e pelo menos **1 outra igreja** adota ao menos um módulo até o fim da Fase 3.

---

## 2. Arquitetura-alvo (macro)

```
                         ┌─────────────────────────┐
                         │   Núcleo compartilhado   │
                         │  Auth · Membros · Mídia  │
                         └────────────┬─────────────┘
        ┌──────────────┬─────────────┼──────────────┬──────────────┐
        ▼              ▼             ▼              ▼              ▼
  Biblioteca      Repositório     ChMS +        App da        Discipulado
  (0.1 atual)     Imagens (0.2)   Finanças      congregação   / Trilhas
                                  (Fase 2)       (Fase 2)      (Fase 3)
```

Os dois projetos atuais viram os **primeiros módulos**; o núcleo compartilhado (login + cadastro
de membros + mídia) é o que os conecta e evita retrabalho.

---

## 3. Fases

### Fase 0 — Fundação e consolidação *(mês 1–2)*
**Meta**: organizar o que existe e criar a base comum.

| Entregável | Descrição | Projeto |
|---|---|---|
| Especificação do MVP da Biblioteca | Modelo de dados (livro, exemplar, empréstimo, membro), telas essenciais | `ADmoema-Biblio` |
| Estrutura do repositório de imagens | Padrão de pastas, metadados, categorias, licenciamento de arte | `imagens` |
| Decisão de stack | Linguagem, framework, banco, hospedagem, estratégia PWA/offline | núcleo |
| Modelo de "Membro" compartilhado | Cadastro único reutilizável por todos os módulos | núcleo |
| README + convenções | Contribuição, branches, padrão de commits | ambos |

**Critério de saída**: biblioteca com CRUD de livros funcionando e stack decidida.

---

### Fase 1 — Biblioteca + Mídia em produção *(mês 2–4)*
**Meta**: entregar valor real e imediato com os dois projetos atuais.

| Entregável | Dor atendida |
|---|---|
| **Biblioteca**: catálogo, busca, empréstimo/devolução, ficha do livro | Gestão manual de acervo; apoio ao discipulado/formação |
| **Biblioteca**: relatórios simples (acervo, empréstimos ativos, atrasos) | Controle e visibilidade |
| **Imagens**: banco de artes/mídia com busca e categorias | Comunicação visual, identidade, redes sociais |
| **Imagens**: reuso por outros ministérios (tags por evento/série) | Ruído e retrabalho de comunicação |
| Autenticação básica + papéis (admin, líder, membro) | Segurança de dados |

**Critério de saída**: AD Moema usando a biblioteca e o banco de imagens no dia a dia.

---

### Fase 2 — Núcleo de gestão (o maior impacto) *(mês 4–9)*
**Meta**: atacar a dor nº 1 global — comunicação + gestão — e giving.

| Entregável | Dor atendida | Prioridade |
|---|---|---|
| **ChMS**: cadastro de membros/visitantes, famílias, células/GCs | Gestão manual/descentralizada | Alta |
| **ChMS**: escalas de voluntários e agenda de cultos/eventos | Sobrecarga e capacitação de leigos | Alta |
| **Finanças**: lançamentos, categorias, relatórios; **dízimos/ofertas via Pix** | Controle financeiro frágil; giving | Alta |
| **App/PWA da congregação**: avisos, agenda, devocional, pedidos de oração | Comunicação (dor nº 1) e engajamento | Alta |
| Notificações (push/e-mail/WhatsApp) | Ruído de comunicação | Média |
| Modo offline (PWA) para conexões fracas | Acesso em qualquer contexto | Média |

**Critério de saída**: secretaria, finanças e comunicação da AD Moema rodando no sistema; ofertas
digitais ativas.

---

### Fase 3 — Discipulado, jovens e liderança *(mês 9–14)*
**Meta**: reter jovens e sustentar a liderança.

| Entregável | Dor atendida |
|---|---|
| **Trilhas de discipulado** (planos de leitura, checkpoints, mentoria) | Evasão Gen Z; lacuna do discipulado digital |
| **EAD / formação de líderes leigos** reusando a **Biblioteca** como acervo | 60% das igrejas pequenas lutam para capacitar líderes |
| Foco em "usar os dons" (ponto fraco de engajamento Gen Z) | Baixo engajamento eclesial dos jovens |
| **Bem-estar pastoral**: check-ins, rede de apoio, indicadores | Burnout (40% em alto risco; 29% sem confidente) |

**Critério de saída**: ao menos uma trilha de discipulado ativa e uma turma de formação rodando.

---

### Fase 4 — Missão digital e replicação *(mês 14–18+)*
**Meta**: alcance externo e levar o ecossistema a outras igrejas.

| Entregável | Dor atendida | Alcance |
|---|---|---|
| **Evangelismo digital**: agendamento multi-rede + kits de arte (usa `imagens`) + follow-up de contatos | Digital como campo essencial (95%) com presença fraca | Global |
| **Bíblia/áudio-Bíblia offline multilíngue** | Acesso à Bíblia em baixa conectividade (África/Ásia) | Sul Global |
| **Multi-igreja (multi-tenant)** + localização (idioma/moeda, mobile money) | Software dos EUA não serve ao Sul Global | Replicação |
| Curadoria de **comunicação segura** para contextos de perseguição (parceria, não reinventar) | Ásia/Oriente Médio | Sensível |

**Critério de saída**: sistema multi-igreja e ao menos 1 congregação externa usando um módulo.

---

## 4. Linha do tempo (resumo)

```
Mês:    1   2   3   4   5   6   7   8   9   10  11  12  13  14  15  16  17  18
Fase 0  ██████
Fase 1      ████████████
Fase 2              ████████████████████
Fase 3                              ████████████████
Fase 4                                              ████████████████████►
```

*Prazos indicativos, ajustáveis conforme disponibilidade de equipe/voluntários.*

---

## 5. Dependências e sequência

- **Núcleo de Membros (Fase 0)** é pré-requisito de ChMS, App e Discipulado — construir primeiro.
- **Biblioteca (Fase 1)** é reaproveitada como acervo do **EAD (Fase 3)**.
- **Repositório de imagens (Fase 1)** vira banco de artes do **evangelismo digital (Fase 4)**.
- **Finanças/Pix (Fase 2)** é a base para o **mobile money (Fase 4)** na replicação internacional.
- **Multi-tenant (Fase 4)** deve ser considerado na modelagem desde a Fase 0 (não travar decisões
  que impeçam multi-igreja depois).

---

## 6. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Escopo grande para equipe pequena/voluntária | Entregar por módulos; cada fase gera valor sozinha |
| Resistência à adoção digital na igreja | Começar pela biblioteca (baixa fricção); treinar líderes |
| Dependência de uma pessoa-chave | Documentar tudo; código aberto no repositório |
| Segurança de dados de membros (LGPD) | Papéis/permissões e consentimento desde a Fase 1 |
| Sustentabilidade financeira | Modular; começar com hospedagem barata; buscar parceiros |

---

## 7. Próximos passos imediatos

1. **Validar este roadmap** com a liderança da AD Moema (prioridades e prazos).
2. **Decidir a stack** (Fase 0) — proponho detalhar em um documento técnico à parte.
3. **Especificar o MVP da Biblioteca** (modelo de dados + telas) para começar a codar.
4. Abrir **issues** no GitHub por entregável da Fase 0/1 para acompanhar o progresso.

---

*Roadmap vivo — revisar ao fim de cada fase. Alinhado às dores levantadas na pesquisa global
(comunicação, gestão, evasão de jovens, burnout, discipulado digital) e ao contexto do Sul Global
(mobile-first, offline, localização).*
