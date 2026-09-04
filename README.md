# Laço

Plataforma para criar páginas afetivas personalizadas para qualquer pessoa e ocasião. Cada página combina uma história escrita em linguagem natural, fotos selecionadas, música e uma identidade visual coerente com o contexto.

## Desenvolvimento

```bash
npm ci
npm run build
npm test
npm start
```

A aplicação fica disponível em `http://localhost:3000` e o health check em `/health`.

## Configuração

- `OPENAI_API_KEY`: ativa a geração personalizada pela Responses API. Sem a chave, a aplicação usa um fallback local.
- `OPENAI_MODEL`: modelo de geração, padrão `gpt-5-mini`.
- `DATA_PATH`: diretório persistente para páginas, fotos e músicas, padrão `./data`.
- `PORT`: porta HTTP, padrão `3000`.

Em produção, monte um volume persistente no caminho definido por `DATA_PATH`.

## Privacidade

O prompt original não é armazenado. A chamada à OpenAI usa `store: false`. Fotos e músicas permanecem no volume da aplicação e cada página recebe uma URL aleatória não indexada.
