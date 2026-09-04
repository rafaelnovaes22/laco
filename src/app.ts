import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import multer from 'multer';
import path from 'node:path';
import { ZodError } from 'zod';
import { celebrationInputSchema } from './celebration.js';
import type { CelebrationCopyGenerator } from './celebration-generator.js';
import { cleanupUploadedMedia, createMediaUpload, extractUploadedMedia, validateUploadedMedia } from './media-upload.js';
import { readCelebration, resolveMediaPath, saveCelebration } from './celebration-store.js';

export interface AppDependencies { publicPath: string; storagePath: string; generateCopy: CelebrationCopyGenerator; }

function setSecurityHeaders(_: Request, response: Response, next: NextFunction): void {
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
}

function createCelebrationHandler(dependencies: AppDependencies) {
  return async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    const media = extractUploadedMedia(request);
    try {
      validateUploadedMedia(media);
      const input = celebrationInputSchema.parse(request.body);
      const copy = await dependencies.generateCopy(input);
      const celebration = saveCelebration(dependencies.storagePath, input, copy, media);
      response.status(201).json({ id: celebration.id, url: `/c/${celebration.slug}` });
    } catch (error) {
      cleanupUploadedMedia(media);
      next(error);
    }
  };
}

function respondToError(error: unknown, _: Request, response: Response, __: NextFunction): void {
  if (error instanceof ZodError) {
    response.status(400).json({ error: error.issues[0]?.message ?? 'Dados inválidos.' });
    return;
  }
  if (error instanceof multer.MulterError || error instanceof Error) {
    response.status(400).json({ error: error.message });
    return;
  }
  console.error(JSON.stringify({ event: 'unexpected_request_error' }));
  response.status(500).json({ error: 'Não foi possível criar a página.' });
}

export function createApp(dependencies: AppDependencies): Express {
  const celebrationApp = express();
  const uploadMedia = createMediaUpload(dependencies.storagePath);
  celebrationApp.use(setSecurityHeaders);
  celebrationApp.use(express.static(dependencies.publicPath));
  celebrationApp.get('/health', (_request, response) => response.json({ status: 'ok', service: 'laco', uptime: Math.round(process.uptime()) }));
  celebrationApp.post('/api/celebrations', uploadMedia, createCelebrationHandler(dependencies));
  celebrationApp.get('/api/celebrations/:slug', (request, response) => {
    const celebration = readCelebration(dependencies.storagePath, request.params.slug);
    response.status(celebration ? 200 : 404).json(celebration ?? { error: 'Página não encontrada.' });
  });
  celebrationApp.get('/media/:slug/:filename', (request, response) => {
    const mediaPath = resolveMediaPath(dependencies.storagePath, request.params.slug, request.params.filename);
    if (!mediaPath) return response.status(404).json({ error: 'Arquivo não encontrado.' });
    return response.sendFile(mediaPath);
  });
  celebrationApp.get('/c/:slug', (_request, response) => response.sendFile(path.join(dependencies.publicPath, 'celebration.html')));
  celebrationApp.get('*', (_request, response) => response.sendFile(path.join(dependencies.publicPath, 'index.html')));
  celebrationApp.use(respondToError);
  return celebrationApp;
}
