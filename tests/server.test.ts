import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createApp } from '../src/app.js';
import { createFallbackCopy } from '../src/celebration-generator.js';

const storagePath = mkdtempSync(path.join(tmpdir(), 'laco-test-'));
const app = createApp({ publicPath: path.resolve('public'), storagePath, generateCopy: async (input) => createFallbackCopy(input) });

afterAll(() => rmSync(storagePath, { recursive: true, force: true }));

describe('health-check', () => {
  it('identifica o serviço genérico', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: 'ok', service: 'laco' });
  });
});

describe('celebrations', () => {
  it('cria e recupera uma página para qualquer ocasião', async () => {
    const created = await request(app).post('/api/celebrations')
      .field('recipient', 'Dona Lúcia').field('relationship', 'minha mãe')
      .field('occasion', 'Dia das Mães').field('prompt', 'Ela fez da nossa casa um lugar seguro, cheio de café e conversas longas.')
      .field('tone', 'emocionante').field('signature', 'Seus filhos')
      .field('visualStyle', 'automatico').field('coverPhotoIndex', '0').field('consent', 'on');

    expect(created.status).toBe(201);
    const page = await request(app).get(`/api/celebrations/${created.body.url.split('/').pop()}`);
    expect(page.status).toBe(200);
    expect(page.body.recipient).toBe('Dona Lúcia');
    expect(page.body.copy.theme).toBe('jardim');
    expect(page.body).not.toHaveProperty('prompt');
  });

  it('rejeita histórias sem contexto suficiente', async () => {
    const response = await request(app).post('/api/celebrations').field('recipient', 'Ana');
    expect(response.status).toBe(400);
  });
});
