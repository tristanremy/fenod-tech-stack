import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { exportStarter } from './export-starter.mjs';

test('immutable export excludes dirty/untracked content, preserves provenance and refuses overwrite/unsafe trees', () => {
  const root = mkdtempSync(join(tmpdir(), 'fenod-export-test-'));
  try {
    const repo = join(root, 'repo');
    const app = join(repo, 'examples/smoke');
    mkdirSync(app, { recursive: true });
    const git = (...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8' }).trim();
    git('init', '-q');
    git('config', 'user.name', 'Export Test');
    git('config', 'user.email', 'fixture@example.test');
    writeFileSync(join(app, 'package.json'), JSON.stringify({ private: true, packageManager: 'pnpm@10.24.0' }));
    for (const doc of ['AGENTS.md', 'README.md', 'STACK.md']) writeFileSync(join(app, doc), 'https://github.com/tristanremy/fenod-tech-stack/blob/UPSTREAM_REVISION/docs/stack-contract.md');
    git('add', '.'); git('commit', '-qm', 'fixture');
    const revision = git('rev-parse', 'HEAD');
    writeFileSync(join(app, 'package.json'), 'dirty');
    writeFileSync(join(app, '.env.local'), 'SYNTHETIC=not-a-secret');
    const out = join(root, 'app');
    assert.equal(exportStarter(repo, revision, out), revision);
    assert.equal(JSON.parse(readFileSync(join(out, 'package.json'))).private, true);
    assert.equal(existsSync(join(out, '.env.local')), false);
    assert.equal(JSON.parse(readFileSync(join(out, 'starter-provenance.json'))).revision, revision);
    assert.ok(readFileSync(join(out, 'AGENTS.md'), 'utf8').includes(`/blob/${revision}/`));
    assert.throws(() => exportStarter(repo, revision, out), /already exists/);
    git('add', 'examples/smoke/.env.local'); git('commit', '-qm', 'unsafe fixture');
    assert.throws(() => exportStarter(repo, 'HEAD', join(root, 'unsafe')), /Forbidden export entry/);
    assert.equal(existsSync(join(root, 'unsafe')), false);
    git('rm', 'examples/smoke/.env.local');
    symlinkSync('/tmp', join(app, 'escape'));
    git('add', 'examples/smoke/escape'); git('commit', '-qm', 'symlink fixture');
    assert.throws(() => exportStarter(repo, 'HEAD', join(root, 'symlink')), /Non-regular/);
    assert.throws(() => exportStarter(repo, '--all', join(root, 'bad')), /explicit Git revision/);
    assert.throws(() => exportStarter(repo, 'unknown-revision', join(root, 'bad')));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
