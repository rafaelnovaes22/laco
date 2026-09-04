import express from 'express';
import { timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicPath = path.join(__dirname, '..', 'public');
const mediaPath = process.env.MEDIA_PATH || path.join(__dirname, '..', 'data');
const audioPath = path.join(mediaPath, 'theme-song.audio');
const metadataPath = path.join(mediaPath, 'theme-song.json');

function readThemeSong() {
  if (!existsSync(audioPath) || !existsSync(metadataPath)) return null;

  try {
    return JSON.parse(readFileSync(metadataPath, 'utf8'));
  } catch {
    return null;
  }
}

function hasValidUploadKey(candidate = '') {
  const expected = process.env.UPLOAD_KEY || '';
  const received = Buffer.from(candidate);
  const configured = Buffer.from(expected);
  if (!received.length || received.length !== configured.length) return false;
  return timingSafeEqual(received, configured);
}

function storeThemeSong(audio, mimeType) {
  mkdirSync(mediaPath, { recursive: true });
  writeFileSync(audioPath, audio);
  const metadata = { mimeType, updatedAt: new Date().toISOString() };
  writeFileSync(metadataPath, JSON.stringify(metadata), 'utf8');
  return metadata;
}

app.use((_, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=86400');
  next();
});
app.use(express.static(publicPath));

app.get('/health', (_, res) => {
  res.json({ status: 'ok', service: 'debora-site', uptime: Math.round(process.uptime()) });
});

app.get('/api/theme-song/meta', (_, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const song = readThemeSong();
  res.json(song ? { available: true, updatedAt: song.updatedAt } : { available: false });
});

app.get('/api/theme-song', (_, res) => {
  const song = readThemeSong();
  if (!song) return res.status(404).json({ error: 'Gravação ainda não enviada.' });

  res.setHeader('Cache-Control', 'public, max-age=300');
  res.setHeader('Content-Disposition', 'inline');
  res.type(song.mimeType);
  return res.sendFile(audioPath);
});

app.put('/api/theme-song', express.raw({ type: 'audio/*', limit: '60mb' }), (req, res) => {
  if (!hasValidUploadKey(req.get('x-upload-key'))) {
    return res.status(401).json({ error: 'Chave de envio inválida.' });
  }
  if (!Buffer.isBuffer(req.body) || !req.body.length) {
    return res.status(400).json({ error: 'Selecione um arquivo de áudio válido.' });
  }

  const mimeType = req.get('content-type')?.split(';')[0] || 'audio/mpeg';
  const song = storeThemeSong(req.body, mimeType);
  return res.status(201).json({ ok: true, updatedAt: song.updatedAt });
});

app.get('*', (_, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

export default app;

if (process.env.NODE_ENV !== 'test') {
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => {
    console.log(`Servidor on-line: http://localhost:${port}`);
  });
}
