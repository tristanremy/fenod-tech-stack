import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const roots = ['README.md', 'CONTEXT.md', 'src/content/docs', 'docs/adr', 'public/llms.txt', 'public/llms-full.txt'];
const deny = [
  /sk-[A-Za-z0-9_-]{20,}/,
  /ghp_[A-Za-z0-9_]{20,}/,
  /CLOUDFLARE_API_TOKEN\s*=\s*(?!\.\.\.)([A-Za-z0-9_\-]{12,})/,
  /\/Users\/tr\//,
  /~\/dev\//,
  /audrain-patrimoine/i,
];

async function walk(entry: string): Promise<string[]> {
  const info = await stat(entry).catch(() => undefined);
  if (!info) return [];
  if (info.isFile()) return [entry];
  const entries = await readdir(entry, { withFileTypes: true });
  const files = await Promise.all(entries.map((item) => {
    const full = path.join(entry, item.name);
    return item.isDirectory() ? walk(full) : Promise.resolve([full]);
  }));
  return files.flat();
}

const files = (await Promise.all(roots.map(walk))).flat().filter((file) => /\.(md|txt|mjs|ts|json|jsonc)$/.test(file));
const findings: string[] = [];
for (const file of files) {
  const text = await readFile(file, 'utf8');
  const lines = text.split('\n');
  lines.forEach((line, index) => {
    for (const pattern of deny) {
      if (pattern.test(line)) findings.push(`${file}:${index + 1}: ${pattern}: ${line.trim()}`);
    }
  });
}

if (findings.length > 0) {
  console.error('Public safety scan failed:');
  for (const finding of findings) console.error(finding);
  process.exit(1);
}

console.log(`Public safety scan passed for ${files.length} files.`);
