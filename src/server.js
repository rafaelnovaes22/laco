import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicPath = path.join(__dirname, '..', 'public');

app.use((_, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=86400');
  next();
});
app.use(express.static(publicPath));

app.get('/health', (_, res) => {
  res.json({ status: 'ok', service: 'debora-site', uptime: Math.round(process.uptime()) });
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
