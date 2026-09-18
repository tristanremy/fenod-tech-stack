// App-level Doppler pilot (plan 010, S4 acceptance: "the app starts with real
// dev resolution").
//
// Run from a terminal the coding agent cannot inspect:
//
//   read -rs 'DOPPLER_TOKEN?Token: '; printf '\n'
//   (export DOPPLER_TOKEN; node scripts/doppler-app-pilot.mjs)
//   unset DOPPLER_TOKEN
//
// The starter in examples/smoke is left untouched: this exports a disposable
// copy of HEAD, points it at the Doppler dev config, and starts it locally.
// No deployment, no remote D1, no Cloudflare credential.

import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { exportStarter } from './export-starter.mjs';
import { DOPPLER_PLUGIN, requireToken, scrub } from './doppler-pilot.mjs';

const ORIGIN = 'http://localhost:3000';

export function appSchema(project, config) {
  return `# @plugin(@varlock/doppler-plugin)
# @initDoppler(project=${project}, config=${config}, serviceToken=$DOPPLER_TOKEN, cacheTtl=false)
# @cache=disabled
# ---

# @type=dopplerServiceToken @sensitive @internal
DOPPLER_TOKEN=

APP_ENV=doppler()
BETTER_AUTH_URL=doppler()
# @sensitive
BETTER_AUTH_SECRET=doppler()
`;
}

export async function assertPortFree(port = 3000) {
  const { createConnection } = await import('node:net');
  await new Promise((done, fail) => {
    const probe = createConnection({ port, host: '127.0.0.1' });
    probe.on('connect', () => {
      probe.destroy();
      fail(new Error(`Port ${port} is already in use; stop that server first.`));
    });
    probe.on('error', () => done());
  });
}

function pnpm(cwd, args, env) {
  const result = spawnSync('pnpm', args, { cwd, encoding: 'utf8', env });
  return { status: result.status, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

async function waitForServer(child, output) {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Dev server exited early.\n${scrub(output())}`);
    try {
      const response = await fetch(ORIGIN, { redirect: 'manual' });
      if (response.status > 0) return response.status;
    } catch {
      // Not listening yet.
    }
    await new Promise((done) => setTimeout(done, 500));
  }
  throw new Error(`Dev server did not answer within 90s.\n${scrub(output())}`);
}

async function run() {
  const token = requireToken();
  const project = process.env.DOPPLER_PROJECT ?? 'fenod-starter-pilot';
  const config = process.env.DOPPLER_CONFIG ?? 'dev';
  const root = resolve(import.meta.dirname, '..');
  const directory = mkdtempSync(join(tmpdir(), 'fenod-doppler-app-'));
  const app = join(directory, 'app');
  const env = { PATH: process.env.PATH, HOME: process.env.HOME, CI: '1' };
  let server = null;
  try {
    await assertPortFree();
    exportStarter(root, 'HEAD', app);
    writeFileSync(join(app, '.env.schema'), appSchema(project, config));

    const manifestPath = join(app, 'package.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    manifest.devDependencies['@varlock/doppler-plugin'] = DOPPLER_PLUGIN;
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    const installed = pnpm(app, ['install', '--no-frozen-lockfile'], env);
    assert.equal(installed.status, 0, `Install failed:\n${scrub(installed.stderr)}`);

    const types = pnpm(app, ['cf-types'], { ...env, DOPPLER_TOKEN: token });
    assert.equal(types.status, 0, `Worker type generation failed:\n${scrub(types.stderr)}`);
    const generated = readFileSync(join(app, 'worker-configuration.d.ts'), 'utf8');
    assert.doesNotMatch(generated, /DOPPLER_TOKEN/, 'Internal token leaked into Worker types');
    assert.doesNotMatch(generated, /dp\.st\./, 'Service token leaked into Worker types');
    assert.equal(
      scrub(generated),
      generated,
      'Secret-like value written into generated Worker types',
    );
    for (const name of ['APP_ENV', 'BETTER_AUTH_URL', 'BETTER_AUTH_SECRET']) {
      assert.match(generated, new RegExp(`\\b${name}:`), `Missing Worker binding ${name}`);
    }

    let output = '';
    server = spawn('pnpm', ['dev'], {
      cwd: app,
      env: { ...env, DOPPLER_TOKEN: token },
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const collect = (chunk) => { output = `${output}${chunk}`.slice(-8000); };
    server.stdout.on('data', collect);
    server.stderr.on('data', collect);

    const status = await waitForServer(server, () => output);
    assert.equal(status, 200, `Root page returned ${status}:\n${scrub(output)}`);
    const session = await fetch(`${ORIGIN}/api/auth/get-session`);
    assert.equal(session.status, 200, `Session endpoint returned ${session.status}`);

    process.stdout.write(`\nProject/config: ${project}/${config}\n`);
    process.stdout.write(`Root status: ${status}\n`);
    process.stdout.write(`Session endpoint: ${session.status}\n`);
    process.stdout.write(`Varlock injection logged: ${/varlock/i.test(output)}\n`);
    process.stdout.write(`Token absent from server output: ${!output.includes(token)}\n`);
    process.stdout.write('\nPASS  app starts with real dev resolution\n');
  } finally {
    if (server?.pid) {
      try { process.kill(-server.pid, 'SIGTERM'); } catch { /* already gone */ }
    }
    rmSync(directory, { recursive: true, force: true });
  }
}

run().catch((error) => {
  process.stderr.write(`\nPilot failed: ${error.message}\n`);
  process.exitCode = 1;
});
