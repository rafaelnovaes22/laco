# Laço: carta e música para Débora

Página pessoal com a carta, fotografias, abertura da leitura e player de uma gravação publicada pelo responsável. Preserva o conteúdo existente. Não é uma plataforma multiusuário nem gera cartas, fotos ou músicas.

## Publicação da gravação

Configure `UPLOAD_KEY` fora do repositório. O formulário exige essa chave e aceita áudio de até 60 MB. Sem chave configurada, o envio fica indisponível; quem abre a página pode ouvir uma gravação já publicada.

Os bytes e metadados ficam em `MEDIA_PATH` (padrão local `./data`; no container `/data`). Um volume persistente nesse caminho é necessário para preservar a música entre deploys. Não colocar gravações ou `.env` no Git ou na imagem. Não existe áudio incluído no repositório nem geração automática de música.

A página usa noindex e noarchive, mas continua acessível a quem tiver a URL. A chave protege a publicação do áudio, não a leitura da carta.

## Etapas de execução

1. Acesse a pasta do projeto e instale dependências
   ```bash
   npm ci
   ```

2. Rode build local
   ```bash
   npm run build
   ```

3. Valide o health check em execução local
   ```bash
   npm start
   ```
   depois acesse `http://localhost:3000/health`

4. Faça testes
   ```bash
   npm test
   ```
