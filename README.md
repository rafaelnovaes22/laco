# Laço

Template de carta digital personalizável: uma tela de abertura, uma mensagem principal, uma música e uma carta.

## Personalizar

Edite só o arquivo `public/config.js`: nome de quem recebe, quem assina, textos de cada seção, parágrafos da carta e imagens.

Para usar fotos próprias, coloque os arquivos em `public/assets/` e troque os caminhos `image` no `config.js`. Por padrão o template usa imagens neutras.

## Música

A música é enviada pela própria página, na seção "Área reservada para enviar a gravação". O envio exige a chave definida na variável de ambiente `UPLOAD_KEY` do servidor. O áudio fica em `data/` (ou no caminho de `MEDIA_PATH`).

## Rodar

```bash
npm ci
npm run build
UPLOAD_KEY=sua-chave npm start   # http://localhost:3000 e /health
npm test
```

A página usa `noindex` e o `robots.txt` bloqueia buscadores.
