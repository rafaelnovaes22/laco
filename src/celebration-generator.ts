import OpenAI from 'openai';
import { celebrationCopySchema, type CelebrationCopy, type CelebrationInput } from './celebration.js';

export type CelebrationCopyGenerator = (input: CelebrationInput) => Promise<CelebrationCopy>;

const COPY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['kicker', 'headline', 'opening', 'messageTitle', 'paragraphs', 'declaration', 'closing', 'theme'],
  properties: {
    kicker: { type: 'string' }, headline: { type: 'string' }, opening: { type: 'string' },
    messageTitle: { type: 'string' }, paragraphs: { type: 'array', minItems: 3, maxItems: 3, items: { type: 'string' } },
    declaration: { type: 'string' }, closing: { type: 'string' },
    theme: { type: 'string', enum: ['editorial', 'solar', 'jardim', 'oceano', 'noite'] },
  },
} as const;

function inferTheme(input: CelebrationInput): CelebrationCopy['theme'] {
  if (input.visualStyle !== 'automatico') return input.visualStyle;
  const context = `${input.occasion} ${input.tone} ${input.relationship}`.toLowerCase();
  if (/anivers|formatura|conquista|nascimento/.test(context)) return 'solar';
  if (/mãe|pai|família|filh/.test(context)) return 'jardim';
  if (/românt|namor|casamento/.test(context)) return 'noite';
  if (/memória|saudade|homenagem/.test(context)) return 'oceano';
  return 'editorial';
}

function inferDeclaration(input: CelebrationInput): string {
  const context = `${input.occasion} ${input.relationship} ${input.tone}`.toLowerCase();
  if (/memória|saudade|homenagem/.test(context)) return 'Seu amor continua presente.';
  if (/mãe|pai|família|filh/.test(context)) return 'Seu amor faz parte de quem eu sou.';
  if (/românt|namor|casamento/.test(context)) return 'Eu escolheria você de novo.';
  if (/amiz|amig/.test(context)) return 'A vida ficou melhor porque nos encontramos.';
  return 'Você faz diferença na minha história.';
}

export function createFallbackCopy(input: CelebrationInput): CelebrationCopy {
  return {
    kicker: input.occasion,
    headline: `${input.recipient}, esta história é para você.`,
    opening: `Uma homenagem ${input.tone} para celebrar ${input.relationship} e tudo o que esse vínculo representa.`,
    messageTitle: 'O que eu queria que você soubesse',
    paragraphs: [input.prompt.slice(0, 900), `Hoje, em ${input.occasion.toLowerCase()}, eu quis guardar em um só lugar um pouco do que vivemos.`, 'Que estas palavras, imagens e lembranças façam você sentir o carinho que existe por trás de cada escolha.'],
    declaration: inferDeclaration(input),
    closing: 'Volte a esta página sempre que quiser lembrar o quanto você é especial.',
    theme: inferTheme(input),
  };
}

async function generateWithOpenAI(client: OpenAI, model: string, input: CelebrationInput): Promise<CelebrationCopy> {
  // Responses API + Structured Outputs: https://platform.openai.com/docs/api-reference/responses/create
  const response = await client.responses.create({
    model,
    store: false,
    instructions: 'Escreva em português brasileiro uma homenagem afetiva elegante. Use somente fatos fornecidos. Não invente memórias. Respeite qualquer tipo de vínculo, sem presumir romance. Produza exatamente três parágrafos e escolha um tema coerente.',
    input: JSON.stringify(input),
    text: { format: { type: 'json_schema', name: 'celebration_copy', strict: true, schema: COPY_SCHEMA } },
  });
  return celebrationCopySchema.parse(JSON.parse(response.output_text));
}

export function createCelebrationCopyGenerator(apiKey: string | undefined, model: string): CelebrationCopyGenerator {
  if (!apiKey) return async (input) => createFallbackCopy(input);
  const client = new OpenAI({ apiKey });
  return async (input) => {
    try {
      return await generateWithOpenAI(client, model, input);
    } catch (error) {
      console.error(JSON.stringify({ event: 'copy_generation_fallback', error: error instanceof Error ? error.message : 'unknown' }));
      return createFallbackCopy(input);
    }
  };
}
