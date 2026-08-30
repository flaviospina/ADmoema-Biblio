# 🚀 Publicar na HostGator (passo a passo)

O sistema é **PHP MVC + MySQL** com **URLs amigáveis** — feito sob medida para a
hospedagem compartilhada da HostGator (cPanel). Você só precisa do navegador.

> ⏱️ Uns 15 minutos na primeira vez.

---

## Passo 1 — Criar o banco MySQL no cPanel
1. Entre no **cPanel** da HostGator.
2. Abra **Bancos de Dados MySQL®** (MySQL Databases).
3. Em **Criar Novo Banco de Dados**, digite `cantata` e clique **Criar**.
   O nome final fica com o prefixo da conta, ex.: `seuusuario_cantata`.
4. Em **Usuários MySQL → Adicionar Novo Usuário**, crie o usuário `cantata`
   com uma **senha forte** (anote!). Fica ex.: `seuusuario_cantata`.
5. Em **Adicionar Usuário ao Banco de Dados**, selecione o usuário e o banco,
   clique **Adicionar** e marque **TODOS OS PRIVILÉGIOS** → **Fazer alterações**.

## Passo 2 — Importar as tabelas
1. No cPanel, abra o **phpMyAdmin**.
2. Clique no banco `seuusuario_cantata` na coluna esquerda.
3. Aba **Importar** → **Escolher arquivo** → selecione **`database/schema.sql`**
   (deste projeto) → **Executar**.
4. Deve criar 6 tabelas (users, access_logs, hymns, voice_lines, materials,
   practice_sessions) já com o maestro e 2 hinos de exemplo.

## Passo 3 — Enviar os arquivos
1. No cPanel, abra o **Gerenciador de Arquivos** (File Manager) → pasta
   **`public_html`** (ou a pasta do subdomínio, ex.: `cantata.admoema.com.br`).
2. Envie **todo o CONTEÚDO da pasta `public_html/` do projeto** (index.php,
   .htaccess, config.example.php e as pastas app/, assets/, uploads/).
   💡 Dica: compacte a pasta em .zip, envie e use **Extract** no cPanel.
   ⚠️ Ative "Mostrar arquivos ocultos" (Settings) para conferir o **.htaccess**.
3. Confirme que a pasta **uploads/** existe e tem permissão **755**.

## Passo 4 — Configurar a conexão com o banco
1. No Gerenciador de Arquivos, selecione **config.example.php** → **Copy** →
   nomeie a cópia como **`config.php`**.
2. Edite o **config.php** e preencha:
   - `name` → `seuusuario_cantata`
   - `user` → `seuusuario_cantata`
   - `pass` → a senha criada no Passo 1
   - `host` → `localhost` (padrão da HostGator)
3. Salve.

## Passo 5 — Testar
1. Acesse seu domínio (ex.: `https://cantata.admoema.com.br` ou
   `https://admoema.com.br/`). Deve abrir a tela **Entrar**.
2. Login do maestro: **maestro@admoema.com.br** · senha **admoema123**
   → 🔐 **troque a senha após o primeiro acesso** (ou edite o hash no banco).
3. Teste as URLs amigáveis: `/painel`, `/ensaiar`, `/painel/hinos` …
4. Para o **microfone** funcionar, o site precisa estar em **HTTPS**
   (na HostGator: cPanel → SSL/TLS Status → ative o certificado gratuito
   AutoSSL para o domínio, se ainda não estiver ativo).

## Problemas comuns
| Sintoma | Causa provável | Solução |
|---|---|---|
| Página inicial abre, mas `/painel` dá **404** | `.htaccess` não foi enviado | Reenvie o `.htaccess` (arquivo oculto) para a raiz |
| **Erro 500** | `config.php` com dados errados | Confira nome/usuário/senha do banco (com o prefixo da conta) |
| Login não "segura" (volta para Entrar) | Cookies bloqueados por URL mista | Acesse sempre com **https://** |
| Microfone não pede permissão | Sem HTTPS | Ative o AutoSSL no cPanel |
| Upload de áudio falha | Limite de upload do PHP | cPanel → Select PHP Version → Options → `upload_max_filesize` = 32M |

## Instalando em subpasta (opcional)
Se for publicar em `admoema.com.br/cantata/` (subpasta em vez de domínio/subdomínio),
me avise — é preciso ajustar o `RewriteBase` do `.htaccess` e os caminhos `/assets`
para a subpasta. **Recomendo usar um subdomínio** (`cantata.admoema.com.br`), que
funciona sem nenhum ajuste.

---

## Desenvolvimento local (opcional, para programadores)
Sem MySQL local? Use SQLite:
```bash
php dev/make_dev_db.php
php -S localhost:8080 -t public_html public_html/index.php
```
