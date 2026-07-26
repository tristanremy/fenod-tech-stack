import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const roots = [
  'README.md',
  'CONTEXT.md',
  'src',
  'docs',
  'scripts',
  'skills',
  'examples',
  'plans',
  'public/llms.txt',
  'public/llms-full.txt',
  '.env.example',
  'astro.config.mjs',
  'package.json',
];

// historical private client slug kept split so this source file does not self-match
const privateClientSlug = new RegExp(['audrain', 'patrimoine'].join('-'), 'i');

const deny: RegExp[] = [
  /sk-[A-Za-z0-9_-]{20,}/,
  /ghp_[A-Za-z0-9_]{20,}/,
  /gho_[A-Za-z0-9_]{20,}/,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /CLOUDFLARE_API_TOKEN\s*=\s*(?!\.\.\.|\$\{|your-|<)([A-Za-z0-9_\-]{20,})/,
  /-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----/,
  /\/Users\/tr\//,
  /~\/dev\//,
  privateClientSlug,
  // real-looking CF account/zone ids (not placeholder x's or zeros)
  /account[_-]?id["'\s:=]+["']?[a-f0-9]{32}["']?/i,
];

const skipDir = new Set([
  'node_modules',
  'dist',
  '.wrangler',
  '.git',
  '.astro',
  '.obsidian',
  '.starlight-icons',
]);

const skipFile = /\.(png|jpg|jpeg|gif|webp|svg|woff2?|lock)$/i;

async function walk(entry: string): Promise<string[]> {
  const info = await stat(entry).catch(() => undefined);
  if (!info) return [];
  if (info.isFile()) {
    const base = path.basename(entry);
    if (base === '.env' || base === '.env.local' || base === '.dev.vars') {
      throw new Error(
        `Refusing public scan: secret-like file present on disk: ${entry} (must stay gitignored and ideally deleted before publish)`,
      );
    }
    if (skipFile.test(entry)) return [];
    return [entry];
  }
  const entries = await readdir(entry, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((item) => {
      if (skipDir.has(item.name)) return Promise.resolve([] as string[]);
      return walk(path.join(entry, item.name));
    }),
  );
  return files.flat();
}

const files = (await Promise.all(roots.map(walk)))
  .flat()
  .filter((file) =>
    /\.(md|txt|mjs|ts|tsx|js|json|jsonc|astro|example|toml|yml|yaml)$/.test(file),
  );

const findings: string[] = [];
for (const file of files) {
  const text = await readFile(file, 'utf8');
  const lines = text.split('\n');
  lines.forEach((line, index) => {
    for (const pattern of deny) {
      if (pattern.test(line)) {
        findings.push(`${file}:${index + 1}: ${pattern}: ${line.trim().slice(0, 200)}`);
      }
    }
  });
}

if (findings.length > 0) {
  console.error('Public safety scan failed:');
  for (const finding of findings) console.error(finding);
  process.exit(1);
}

console.log(`Public safety scan passed for ${files.length} files.`);
