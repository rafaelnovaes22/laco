# Etapas de implantação

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
