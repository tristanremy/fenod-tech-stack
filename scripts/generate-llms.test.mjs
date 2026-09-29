import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('context generation is deterministic; checking detects drift and never repairs it', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'fenod-context-'));
  try {
    for (const path of ['AGENTS.md', 'docs', 'skills']) cpSync(join(root, path), join(cwd, path), { recursive: true });
    const context = JSON.parse(readFileSync(join(root, 'agent-context.json'), 'utf8'));
    for (const path of new Set(context.routes.flatMap(({ read }) => read))) {
      cpSync(join(root, path), join(cwd, path), { recursive: true });
    }
    const run = (...args) => spawnSync(process.execPath, [
      '--import', import.meta.resolve('tsx'), join(root, 'scripts/generate-llms.ts'), ...args,
    ], { cwd, encoding: 'utf8', timeout: 15_000 });
    const outputs = ['llms.txt', 'agent-context.json', 'llms-full.txt'];
    const snapshot = () => outputs.map(path => readFileSync(join(cwd, path), 'utf8'));

    assert.equal(run().status, 0);
    const generated = snapshot();
    assert.equal(run().status, 0);
    assert.deepEqual(snapshot(), generated);
    assert.equal(run('--check').status, 0);

    for (const path of outputs) {
      writeFileSync(join(cwd, path), 'stale\n');
      const stale = snapshot();
      const result = run('--check');
      assert.equal(result.status, 1);
      assert.match(result.stderr, /stale or missing/);
      assert.deepEqual(snapshot(), stale);
      assert.equal(run().status, 0);
    }
    rmSync(join(cwd, 'llms.txt'));
    assert.equal(run('--check').status, 1);
    assert.equal(existsSync(join(cwd, 'llms.txt')), false);
    assert.equal(run().status, 0);

    rmSync(join(cwd, 'examples/smoke/package.json'));
    const before = snapshot();
    assert.equal(run('--check').status, 1);
    assert.deepEqual(snapshot(), before);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
