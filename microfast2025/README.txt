# Micro Fast Informática — Site

Este pacote contém o site pronto para publicação.

## Estrutura
- `index.html` — página principal
- `construction.html` — página temporária de portfólio “Em construção”
- `assets/css/style.css` — estilos
- `assets/js/main.js` — scripts
- `assets/images/` — imagens do site
- `assets/logo.png` — logotipo
- `assets/favicon.ico` — favicon 32×32 gerado a partir do seu PNG
- `assets/Curriculum Antonio Rodrigo.pdf` — currículo para download

## Publicar no HostGator (cPanel)
1. Acesse o **cPanel** → **Gerenciador de arquivos**.
2. Entre na pasta **public_html** (ou no diretório do seu domínio).
3. Clique em **Upload** e envie o arquivo `microfast2025.zip`.
4. Selecione o ZIP e clique em **Extract** (Extrair).
5. Mova o conteúdo da pasta extraída para **public_html** (deixe `index.html` diretamente dentro de `public_html`).
6. Atualize o navegador e teste: `https://seu-dominio.com/`.

> **HTTPS forçado (opcional)**: crie/edite o `.htaccess` com:
>
> ```
> RewriteEngine On
> RewriteCond %{HTTPS} !=on
> RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
> ```

## Publicar no GitHub Pages (gratuito)
1. Crie um repositório (ex.: `microfast-informatica`).
2. Envie os arquivos (arraste e solte pelo GitHub web ou faça `git push`).
3. No repositório, vá em **Settings → Pages**.
4. Em **Source**, selecione **Deploy from a branch** → **branch: main** → **/ (root)** → **Save**.
5. A URL ficará assim: `https://SEU-USUARIO.github.io/microfast-informatica/`.

## Dicas
- Substitua as imagens em `assets/images/` mantendo os mesmos nomes para atualizar o site.
- O menu “Portfólio” aponta para `construction.html`. Quando tiver projetos reais, altere o link do menu para `#portfolio` (em uma versão nova do `index.html`) ou crie uma página própria de projetos.
- Atualize a descrição (`<meta name="description">`) conforme desejar.
- Para trocar o WhatsApp, edite os links `wa.me` e `api.whatsapp.com` no `index.html`.

---
© 2025 Micro Fast Informática
