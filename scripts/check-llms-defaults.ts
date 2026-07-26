import { readFile } from 'node:fs/promises';

const path = 'public/llms.txt';
const text = await readFile(path, 'utf8');

const required = [
  'Node 24',
  'Wrangler',
  'Oxlint',
  'Oxfmt',
  'Infisical',
  'Stack Contract is law',
] as const;

const forbidden = [
  // stale default runtime — Node 22 only allowed as migration note, not default line
  /Node 22(?! only)/,
  /Workers\/Pages,\s*Alchemy/,
  /Deploy \| Cloudflare Workers\/Pages \+ Alchemy/,
  /one secrets manager \(Infisical or Bitwarden/,
] as const;

const missing = required.filter((s) => !text.includes(s));
const hits = forbidden.filter((re) => re.test(text)).map(String);

if (missing.length || hits.length) {
  console.error(`llms defaults check failed for ${path}`);
  if (missing.length) console.error('missing:', missing.join(', '));
  if (hits.length) console.error('forbidden matches:', hits.join(', '));
  process.exit(1);
}

console.log(`llms defaults ok (${path})`);
