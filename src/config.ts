import path from 'node:path';

function parsePort(rawPort: string | undefined): number {
  const port = Number(rawPort ?? 3000);
  return Number.isInteger(port) && port > 0 ? port : 3000;
}

export const appConfig = {
  port: parsePort(process.env.PORT),
  publicPath: path.resolve('public'),
  storagePath: path.resolve(process.env.DATA_PATH ?? 'data'),
  openAiModel: process.env.OPENAI_MODEL ?? 'gpt-5-mini',
  maxPhotos: 10,
  maxPhotoBytes: 10 * 1024 * 1024,
  maxAudioBytes: 40 * 1024 * 1024,
} as const;
