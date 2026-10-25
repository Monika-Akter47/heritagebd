// Publishes the images committed under heritagebd-data/uploads/{products,profiles} with the
// frontend: copies them to public/uploads (Vite ships public/ as-is, so Vercel serves them from
// the site's own domain) and lists them in src/data/imageManifest.json, which src/services/api.ts
// uses to load those images without going through the API. Runs before every build ("prebuild").
// Private verification documents are never copied.
import { copyFileSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';

const root = 'heritagebd-data/uploads';
const manifest = {};
for (const dir of ['products', 'profiles']) {
  let files = [];
  try { files = readdirSync(`${root}/${dir}`); } catch { continue; }
  mkdirSync(`public/uploads/${dir}`, { recursive: true });
  for (const file of files) {
    const m = file.match(/^([a-f0-9]{32})\.(jpg|jpeg|png|webp)$/i);
    if (!m) continue;
    manifest[`${dir}/${m[1].toLowerCase()}`] = file;
    copyFileSync(`${root}/${dir}/${file}`, `public/uploads/${dir}/${file}`);
  }
}
writeFileSync('src/data/imageManifest.json', JSON.stringify(manifest) + '\n');
console.log(`images published with the frontend: ${Object.keys(manifest).length}`);
