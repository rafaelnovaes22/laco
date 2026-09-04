import { afterAll, beforeEach, describe, it, expect } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import request from 'supertest';

const mediaPath = mkdtempSync(join(process.cwd(), '.test-media-'));
process.env.MEDIA_PATH = mediaPath;
const { default: app } = await import('../src/server.js');
beforeEach(() => { delete process.env.UPLOAD_KEY; });
afterAll(() => {
  if (!resolve(mediaPath).startsWith(`${process.cwd()}/.test-media-`)) throw new Error('Diretório de teste fora do projeto.');
  rmSync(mediaPath, { recursive: true, force: true });
  delete process.env.MEDIA_PATH;
  delete process.env.UPLOAD_KEY;
});

describe('health-check', () => {
  it('retorna status de funcionamento', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.service).toBe('debora-site');
  });
});

describe('publicação e reprodução da música', () => {
  it('mostra a carta e devolve 404 para recurso ausente', async () => {
    expect((await request(app).get('/')).text).toContain('Para Débora');
    expect((await request(app).get('/arquivo-ausente.js')).status).toBe(404);
  });

  it('explica quando ainda não existe áudio nem chave configurada', async () => {
    const response = await request(app).get('/api/theme-song/meta');
    expect(response.body).toMatchObject({ available: false, uploadEnabled: false });
    expect((await request(app).get('/api/theme-song')).status).toBe(404);
    expect((await request(app).put('/api/theme-song').set('Content-Type', 'audio/mpeg').send(Buffer.from('ID3'))).status).toBe(503);
  });

  it('exige autorização antes de ler o corpo e rejeita formato inválido', async () => {
    process.env.UPLOAD_KEY = 'test-upload-key';
    const unauthorized = await request(app).put('/api/theme-song').set('Content-Type', 'audio/mpeg').send(Buffer.from('ID3'));
    expect(unauthorized.status).toBe(401);
    expect(unauthorized.headers['cache-control']).toBe('no-store');
    const invalid = await request(app).put('/api/theme-song').set('x-upload-key', 'test-upload-key').set('Content-Type', 'text/html').send('<html>');
    expect(invalid.status).toBe(415);
  });

  it('salva um envio autorizado e entrega os mesmos bytes ao player', async () => {
    process.env.UPLOAD_KEY = 'test-upload-key';
    const recording = Buffer.from('ID3test-audio-bytes');
    const upload = await request(app).put('/api/theme-song').set('x-upload-key', 'test-upload-key').set('Content-Type', 'audio/mpeg').send(recording);
    expect(upload.status).toBe(201);
    const metadata = await request(app).get('/api/theme-song/meta');
    expect(metadata.body).toMatchObject({ available: true, updatedAt: upload.body.updatedAt, uploadEnabled: true });
    const playback = await request(app).get('/api/theme-song');
    expect(playback.status).toBe(200);
    expect(playback.headers['content-type']).toBe('audio/mpeg');
    expect(playback.body).toEqual(recording);
  });
});
