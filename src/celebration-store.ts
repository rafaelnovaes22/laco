import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { celebrationCopySchema, type CelebrationCopy, type CelebrationInput, type StoredCelebration } from './celebration.js';
import type { UploadedMedia } from './media-upload.js';

function createSlug(): string {
  return `momento-${randomUUID().slice(0, 8)}`;
}

function moveFile(file: Express.Multer.File, mediaPath: string): string {
  const targetPath = path.join(mediaPath, file.filename);
  renameSync(file.path, targetPath);
  return file.filename;
}

export function saveCelebration(storagePath: string, input: CelebrationInput, copy: CelebrationCopy, media: UploadedMedia): StoredCelebration {
  const slug = createSlug();
  const celebrationPath = path.join(storagePath, 'celebrations', slug);
  const mediaPath = path.join(celebrationPath, 'media');
  mkdirSync(mediaPath, { recursive: true });
  const photoNames = media.photos.map((file) => moveFile(file, mediaPath));
  const audioName = media.music ? moveFile(media.music, mediaPath) : undefined;
  const celebration: StoredCelebration = { id: randomUUID(), slug, createdAt: new Date().toISOString(), recipient: input.recipient, relationship: input.relationship, occasion: input.occasion, celebrationDate: input.celebrationDate, signature: input.signature, tone: input.tone, copy, photos: photoNames.map((name) => `/media/${slug}/${name}`), audio: audioName ? `/media/${slug}/${audioName}` : undefined, musicLink: input.musicLink };
  writeFileSync(path.join(celebrationPath, 'celebration.json'), JSON.stringify(celebration), 'utf8');
  return celebration;
}

export function readCelebration(storagePath: string, slug: string): StoredCelebration | null {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  const recordPath = path.join(storagePath, 'celebrations', slug, 'celebration.json');
  if (!existsSync(recordPath)) return null;
  const parsed = JSON.parse(readFileSync(recordPath, 'utf8')) as StoredCelebration;
  parsed.copy = celebrationCopySchema.parse(parsed.copy);
  return parsed;
}

export function resolveMediaPath(storagePath: string, slug: string, filename: string): string | null {
  if (!/^[a-z0-9-]+$/.test(slug) || !/^[a-f0-9-]+\.[a-z0-9]+$/.test(filename)) return null;
  const mediaPath = path.join(storagePath, 'celebrations', slug, 'media', filename);
  return existsSync(mediaPath) ? mediaPath : null;
}
