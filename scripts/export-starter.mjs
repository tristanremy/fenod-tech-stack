import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function exportStarter(repo, revision, destination) {
  if (!revision || revision.startsWith('-')) throw new Error('An explicit Git revision is required.');
  const git = (...args) => execFileSync('git', ['-C', repo, ...args], {
    maxBuffer: 32 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const commit = git('rev-parse', '--verify', `${revision}^{commit}`).toString().trim();
  const tree = `${commit}:examples/smoke`;
  const entries = git('ls-tree', '-rz', '-r', tree).toString().split('\0').filter(Boolean);
  if (!entries.length) throw new Error('Starter tree is empty.');
  for (const entry of entries) {
    const separator = entry.indexOf('\t');
    const metadata = entry.slice(0, separator);
    const path = entry.slice(separator + 1);
    if (!/^100(644|755) blob /.test(metadata)) throw new Error(`Non-regular export entry: ${path}`);
    if (!path || /[\0-\x1f\\]/u.test(path) || path.startsWith('/') || path.split('/').some((part) =>
      part === '..' || part === '.git' || /^(node_modules|dist|\.wrangler|\.tanstack|\.varlock|test-results|playwright-report)$/.test(part) ||
      (part.startsWith('.env') && !['.env.schema', '.env.example'].includes(part)) ||
      (part.startsWith('.dev.vars') && part !== '.dev.vars.example')
    )) throw new Error(`Forbidden export entry: ${path}`);
  }
  const target = resolve(destination);
  try {
    mkdirSync(target);
  } catch (cause) {
    throw new Error('Destination already exists or its parent is missing; export never overwrites.', { cause });
  }
  try {
    const archive = git('archive', '--format=tar', tree);
    execFileSync('tar', ['-xf', '-', '-C', target], { input: archive });
    let manifest;
    try { manifest = JSON.parse(readFileSync(join(target, 'package.json'), 'utf8')); }
    catch (cause) { throw new Error('Invalid starter manifest.', { cause }); }
    if (!manifest.private || !manifest.packageManager?.startsWith('pnpm@')) throw new Error('Invalid starter manifest.');
    writeFileSync(join(target, 'starter-provenance.json'), `${JSON.stringify({
      repository: 'https://github.com/tristanremy/fenod-tech-stack',
      revision: commit,
      tree: git('rev-parse', tree).toString().trim(),
      path: 'examples/smoke',
      status: 'experimental',
    }, null, 2)}\n`);
    // Exported instructions always point to their immutable source revision.
    for (const name of ['AGENTS.md', 'README.md', 'STACK.md']) {
      const path = join(target, name);
      writeFileSync(path, readFileSync(path, 'utf8').replaceAll('/blob/UPSTREAM_REVISION/', `/blob/${commit}/`));
    }
    return commit;
  } catch (error) {
    rmSync(target, { recursive: true, force: true });
    throw error;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [revision, destination, ...extra] = process.argv.slice(2);
  if (!revision || !destination || extra.length) throw new Error('Usage: node scripts/export-starter.mjs <revision> <new-destination>');
  const repo = resolve(import.meta.dirname, '..');
  const commit = exportStarter(repo, revision, destination);
  process.stdout.write(`Exported experimental starter at ${commit}\n`);
}
