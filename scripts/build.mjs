import { mkdir, copyFile, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const files = ['index.html', 'assets/styles.css', 'assets/app.js', 'assets/config.js'];
for (const file of files) {
  await mkdir(resolve(root, 'dist', file, '..'), { recursive: true });
  await copyFile(resolve(root, file), resolve(root, 'dist', file));
}
if (process.env.MEDGPT_API_URL) {
  const url = new URL(process.env.MEDGPT_API_URL);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('MEDGPT_API_URL must be a public HTTPS Worker URL.');
  await writeFile(resolve(root, 'dist/assets/config.js'), `window.MEDGPT_CONFIG = ${JSON.stringify({ apiBaseUrl: url.origin })};\n`);
}
await writeFile(resolve(root, 'dist/.nojekyll'), '');
const html = await readFile(resolve(root, 'dist/index.html'), 'utf8');
if (!html.includes('./assets/app.js')) throw new Error('Missing app entry.');
console.log('Built dist/: public assets only. No Worker files or secrets are packaged.');
