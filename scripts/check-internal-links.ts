import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const dist = 'dist';
const missing = new Set<string>();
let checked = 0;

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : Promise.resolve([full]);
  }));
  return files.flat();
}

function targetFor(url: string): string | undefined {
  if (!url.startsWith('/') || url.startsWith('//')) return;
  const clean = url.split('#')[0]?.split('?')[0] ?? '';
  if (!clean || clean === '/') return path.join(dist, 'index.html');
  if (clean === '/sitemap-index.xml') return path.join(dist, 'sitemap-index.xml');
  let target = path.join(dist, clean.replace(/^\//, ''));
  if (clean.endsWith('/')) target = path.join(target, 'index.html');
  else if (!path.extname(target)) target = path.join(target, 'index.html');
  return target;
}

for (const file of await walk(dist)) {
  if (!file.endsWith('.html')) continue;
  const html = await readFile(file, 'utf8');
  const matches = html.matchAll(/(?:href|src)="([^"]+)"/g);
  for (const [, url] of matches) {
    const target = targetFor(url);
    if (!target) continue;
    checked += 1;
    if (!existsSync(target)) missing.add(`${file}: ${url} -> ${target}`);
  }
}

if (missing.size > 0) {
  console.error(`Missing internal links/assets: ${missing.size}`);
  for (const item of [...missing].sort()) console.error(item);
  process.exit(1);
}

console.log(`Checked ${checked} internal links/assets; missing 0.`);
