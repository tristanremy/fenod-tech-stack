import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { exportStarter } from './export-starter.mjs';

const ignored = new Set(['node_modules', 'dist', '.wrangler', '.tanstack', '.varlock', 'coverage', 'test-results', 'playwright-report', '.DS_Store']);
function snapshot(root) {
  const hash = createHash('sha256');
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (ignored.has(entry.name) || entry.name.endsWith('.log')) continue;
      const path = join(directory, entry.name);
      if (entry.isDirectory()) visit(path);
      else {
        assert.ok(entry.isFile(), `Unexpected exported entry: ${relative(root, path)}`);
        hash.update(relative(root, path)); hash.update('\0'); hash.update(readFileSync(path)); hash.update('\0');
      }
    }
  };
  visit(root);
  return hash.digest('hex');
}

function run(cwd, env, command, args) {
  const result = spawnSync(command, args, { cwd, env, stdio: 'inherit', timeout: 15 * 60_000 });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `${command} ${args.join(' ')} failed`);
}

const [revision, ...extra] = process.argv.slice(2);
if (!revision || extra.length) throw new Error('Usage: node scripts/verify-starter.mjs <revision>');
const repo = resolve(import.meta.dirname, '..');
const git = (...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
const sourceBefore = git('status', '--porcelain=v1', '-uall');
const root = mkdtempSync(join(tmpdir(), 'fenod-starter-verify-'));
try {
  const app = join(root, 'app');
  const commit = exportStarter(repo, revision, app);
  const provenance = JSON.parse(readFileSync(join(app, 'starter-provenance.json'), 'utf8'));
  assert.equal(provenance.revision, commit);
  assert.equal(provenance.tree, git('rev-parse', `${commit}:examples/smoke`).trim());
  const initial = snapshot(app);
  const realHome = homedir();
  const browsers = process.env.PLAYWRIGHT_BROWSERS_PATH ?? (process.platform === 'darwin'
    ? join(realHome, 'Library/Caches/ms-playwright')
    : join(realHome, '.cache/ms-playwright'));
  const env = {
    PATH: process.env.PATH,
    HOME: join(root, 'home'),
    TMPDIR: process.env.TMPDIR ?? tmpdir(),
    CI: 'true',
    DO_NOT_TRACK: '1',
    WRANGLER_SEND_METRICS: 'false',
    PLAYWRIGHT_BROWSERS_PATH: browsers,
  };
  run(app, env, 'pnpm', ['install', '--frozen-lockfile']);
  assert.equal(snapshot(app), initial, 'Frozen install changed exported source');
  run(app, env, 'pnpm', ['cf-types']);
  assert.equal(snapshot(app), initial, 'Type generation is stale or nondeterministic');
  run(app, env, 'pnpm', ['ship']);
  run(app, env, 'pnpm', ['build']);
  assert.equal(snapshot(app), initial, 'Validation/build changed exported source');
  run(app, env, 'pnpm', ['audit', '--audit-level', 'high']);
  run(app, env, 'pnpm', ['exec', 'playwright', 'install', ...(process.platform === 'linux' ? ['--with-deps'] : []), 'chromium']);
  run(app, env, 'pnpm', ['db:local']);
  run(app, env, 'pnpm', ['db:local']);
  run(app, env, 'pnpm', ['test:e2e']);
  assert.equal(snapshot(app), initial, 'Local/browser verification changed exported source');
  assert.equal(git('status', '--porcelain=v1', '-uall'), sourceBefore, 'Verification changed handbook source');
  process.stdout.write(`Exported starter verification passed at ${commit}\n`);
} finally {
  rmSync(root, { recursive: true, force: true });
}
