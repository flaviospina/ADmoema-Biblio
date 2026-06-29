# 🚀 Como publicar a demonstração online (passo a passo)

Este guia coloca o sistema no ar com um **link público** (HTTPS), sem você
instalar nada no computador. Vamos usar o **Render** — tem plano **gratuito** e
já existe um arquivo de configuração pronto (`render.yaml`) neste projeto.

> ⏱️ Leva uns 10 minutos na primeira vez. Você só precisa do navegador.

---

## Passo 1 — Criar conta no Render
1. Acesse **https://render.com** e clique em **Get Started / Sign Up**.
2. Escolha **“Sign in with GitHub”** e entre com a sua conta do GitHub
   (a mesma dona do repositório `flaviospina/admoema-biblio`).
3. Autorize o Render a acessar seus repositórios.

## Passo 2 — Criar o serviço a partir do Blueprint
1. No painel do Render, clique em **New +** (canto superior direito) →
   **Blueprint**.
2. Selecione o repositório **`admoema-biblio`**.
   - Se ele não aparecer, clique em **“Configure account / repositories”** e
     dê acesso a esse repositório.
3. Em **Branch**, escolha **`claude/choir-voice-analysis-app-15rosf`**
   (⚠️ importante: NÃO use a `main`, o código está nesta branch).
4. O Render vai ler o `render.yaml` automaticamente e mostrar o serviço
   **coral-admoema**. Clique em **Apply / Create**.

## Passo 3 — Aguardar a publicação
1. O Render vai instalar e iniciar o sistema (acompanhe pela aba **Logs**).
   Quando aparecer `🎵 Coral ADMoema — servidor em …`, está no ar.
2. No topo da página do serviço vai aparecer o endereço público, algo como:
   **`https://coral-admoema.onrender.com`**

## Passo 4 — Testar
1. Abra o link no navegador (de preferência **Chrome**).
2. Entre como **maestro** para configurar:
   - E-mail: `maestro@admoema.com.br`
   - Senha: `admoema123`
   - Veja o **Dashboard**, abra **Hinos & melodias** e confira as linhas de voz.
3. Para testar o ensaio de voz: clique em **Criar conta**, escolha um **naipe**
   (ex.: contralto), entre, vá em **Ensaiar minha voz**, escolha um hino e
   **permita o uso do microfone** quando o navegador pedir.

> 🔐 **Troque a senha do maestro** depois do primeiro acesso — a senha padrão é
> só para o teste inicial.

---

## Observações importantes do plano gratuito
- **Hiberna por inatividade:** após ~15 min sem uso, o serviço “dorme”. O
  primeiro acesso seguinte pode levar ~30s para acordar. É normal no plano free.
- **Os dados podem ser reiniciados** quando o serviço reinicia (o banco fica em
  memória temporária no plano gratuito). A conta do maestro e os hinos de exemplo
  são recriados automaticamente, então a demonstração nunca fica vazia.
- **Para uso real (dados permanentes):** basta adicionar um **Disk** ao serviço
  (recurso pago do Render) apontando para `server/data` — eu te oriento quando
  decidirmos colocar em produção (Etapa 5).

## Alternativa: rodar no seu próprio computador
Se preferir testar localmente, instale o **Node.js 22+** (https://nodejs.org),
baixe o código (botão verde **Code → Download ZIP** na branch) e, no terminal
dentro da pasta:
```bash
cd server
npm install
npm start
```
Depois abra **http://localhost:3000**.
