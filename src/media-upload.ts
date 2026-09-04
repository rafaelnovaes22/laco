import { randomUUID } from 'node:crypto';
import { mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import multer, { type FileFilterCallback } from 'multer';
import { appConfig } from './config.js';

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const AUDIO_TYPES = new Set(['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/webm']);
const EXTENSIONS: Record<string, string> = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'audio/mpeg': '.mp3', 'audio/mp4': '.m4a', 'audio/wav': '.wav', 'audio/ogg': '.ogg', 'audio/webm': '.webm' };

export interface UploadedMedia { photos: Express.Multer.File[]; music?: Express.Multer.File; }

function acceptsFile(fieldName: string, mimeType: string): boolean {
  if (fieldName === 'photos') return IMAGE_TYPES.has(mimeType);
  if (fieldName === 'music') return AUDIO_TYPES.has(mimeType);
  return false;
}

function filterMedia(_: Express.Request, file: Express.Multer.File, callback: FileFilterCallback): void {
  if (acceptsFile(file.fieldname, file.mimetype)) return callback(null, true);
  callback(new Error(`Arquivo inválido em ${file.fieldname}: recebido ${file.mimetype}.`));
}

export function createMediaUpload(storagePath: string): ReturnType<typeof multer>['fields'] extends (...args: never[]) => infer Result ? Result : never {
  const stagingPath = path.join(storagePath, 'staging');
  mkdirSync(stagingPath, { recursive: true });
  const storage = multer.diskStorage({
    destination: stagingPath,
    filename: (_, file, callback) => callback(null, `${randomUUID()}${EXTENSIONS[file.mimetype] ?? ''}`),
  });
  return multer({ storage, fileFilter: filterMedia, limits: { files: 11, fileSize: appConfig.maxAudioBytes, fields: 20, parts: 31 } }).fields([{ name: 'photos', maxCount: appConfig.maxPhotos }, { name: 'music', maxCount: 1 }]);
}

export function extractUploadedMedia(request: Express.Request): UploadedMedia {
  const groupedFiles = request.files as Record<string, Express.Multer.File[]> | undefined;
  return { photos: groupedFiles?.photos ?? [], music: groupedFiles?.music?.[0] };
}

export function validateUploadedMedia(media: UploadedMedia): void {
  const oversizedPhoto = media.photos.find((photo) => photo.size > appConfig.maxPhotoBytes);
  if (oversizedPhoto) throw new Error(`Foto muito grande: ${oversizedPhoto.originalname}. Limite de 10 MB.`);
  if (media.music && media.music.size > appConfig.maxAudioBytes) throw new Error(`Música muito grande: ${media.music.originalname}. Limite de 40 MB.`);
}

export function cleanupUploadedMedia(media: UploadedMedia): void {
  [...media.photos, ...(media.music ? [media.music] : [])].forEach((file) => rmSync(file.path, { force: true }));
}
