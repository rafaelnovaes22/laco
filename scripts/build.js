import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const source = resolve('public');
const out = resolve('dist');

if (!existsSync(out)) {
  mkdirSync(out, { recursive: true });
}

for (const file of readdirSync(source, { recursive: true })) {
  const from = join(source, file);
  const to = join(out, file);

  if (statSync(from).isDirectory()) {
    mkdirSync(to, { recursive: true });
    continue;
  }

  const toDir = dirname(to);
  mkdirSync(toDir, { recursive: true });
  cpSync(from, to, { force: true });
}

console.log('Build finalizado em dist/');
