import { build } from 'esbuild';

await Promise.all([
  build({ entryPoints: ['client/creator.ts'], bundle: true, minify: true, outfile: 'public/app.js' }),
  build({ entryPoints: ['client/celebration.ts'], bundle: true, minify: true, outfile: 'public/celebration.js' }),
]);

console.log(JSON.stringify({ event: 'client_build_complete' }));
