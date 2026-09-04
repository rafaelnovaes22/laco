import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/server.js';

describe('health-check', () => {
  it('retorna status de funcionamento', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.service).toBe('debora-site');
  });
});
