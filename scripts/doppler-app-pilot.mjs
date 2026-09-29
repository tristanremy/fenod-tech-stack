// Manual S4 pilot. --fixture exercises the same app path without any vault access.
// Never run live mode in an agent session. See docs/doppler-local-pilot.md.
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { exportStarter } from "./export-starter.mjs";
import { DOPPLER_PLUGIN, requireToken } from "./doppler-pilot.mjs";

export function appSchema(fixture = false) {
  return `${fixture ? "" : `# @plugin(@varlock/doppler-plugin)
# @initDoppler(project=fenod-starter-pilot, config=dev, serviceToken=$DOPPLER_TOKEN, cacheTtl=false)
`}# @defaultRequired=true
# @defaultSensitive=true
# @cache=disabled
# ---

# @optional @sensitive @internal
DOPPLER_TOKEN=

# @type=enum(dev) @public
APP_ENV=${fixture ? "dev" : "doppler()"}
# @type=enum("http://localhost:3000") @public
BETTER_AUTH_URL=${fixture ? "http://localhost:3000" : "doppler()"}
# @type=string(minLength=32) @sensitive
BETTER_AUTH_SECRET=${fixture ? "test-only-local-doppler-app-pilot-fixture-not-a-real-secret" : "doppler()"}
`;
}

// No captured child output is printed: heuristic redaction is not a security boundary.
// Kill the whole child group (including Vite/workerd) before deleting its directory.
export function runStep(cwd, env, args, label, timeout = 600_000) {
  return new Promise((done, fail) => {
    const child = spawn("pnpm", args, { cwd, env, detached: true, stdio: "ignore" });
    const killGroup = (signal) => {
      if (child.pid) {
        try { process.kill(-child.pid, signal); } catch (error) {
          if (error.code !== "ESRCH") throw error;
        }
      }
    };
    let interrupted = false;
    const stop = () => { interrupted = true; killGroup("SIGKILL"); };
    const timer = setTimeout(stop, timeout);
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
    const cleanup = () => {
      clearTimeout(timer);
      process.removeListener("SIGINT", stop);
      process.removeListener("SIGTERM", stop);
      killGroup("SIGKILL");
    };
    child.once("error", () => {
      cleanup();
      fail(new Error(`FAIL ${label}: command unavailable (output withheld).`));
    });
    child.once("close", (code) => {
      cleanup();
      if (interrupted || code !== 0) {
        fail(new Error(`FAIL ${label}: interrupted or nonzero exit (output withheld).`));
      } else {
        process.stdout.write(`PASS ${label}\n`);
        done();
      }
    });
  });
}

export async function run(fixture = false) {
  // Deliberately do not even read an ambient token in fixture mode.
  const token = fixture ? undefined : requireToken();
  const directory = mkdtempSync(join(tmpdir(), "fenod-doppler-app-"));
  const app = join(directory, "app");
  const home = join(directory, "home");
  mkdirSync(home, { mode: 0o700 });
  const env = {
    PATH: process.env.PATH,
    HOME: home,
    TMPDIR: directory,
    CI: "true",
    DO_NOT_TRACK: "1",
    WRANGLER_SEND_METRICS: "false",
    PLAYWRIGHT_BROWSERS_PATH: process.env.PLAYWRIGHT_BROWSERS_PATH ?? join(
      homedir(), process.platform === "darwin" ? "Library/Caches/ms-playwright" : ".cache/ms-playwright",
    ),
  };
  try {
    const revision = exportStarter(resolve(import.meta.dirname, ".."), "HEAD", app);
    process.stdout.write(`Mode: ${fixture ? "fixture (no Doppler)" : "live dev pilot"}\nRevision: ${revision}\n`);
    // Installation and browser downloads never receive the token.
    await runStep(app, env, ["install", "--frozen-lockfile"], "frozen starter install");
    if (!fixture) {
      await runStep(app, env, ["add", "--save-dev", "--save-exact", `@varlock/doppler-plugin@${DOPPLER_PLUGIN}`], "pilot plugin install");
    }
    await runStep(app, env, ["exec", "playwright", "install", "chromium"], "browser preparation");
    writeFileSync(join(app, ".env.schema"), appSchema(fixture));
    const runtime = token ? { ...env, DOPPLER_TOKEN: token } : env;
    await runStep(app, runtime, ["config:check"], "schema validation (including real secret length)");
    await runStep(app, runtime, ["cf-types"], "Worker type generation");
    const generated = readFileSync(join(app, "worker-configuration.d.ts"), "utf8");
    if (/DOPPLER_TOKEN|dp\.st\./.test(generated) || (token && generated.includes(token))) {
      throw new Error("FAIL internal token exclusion from Worker types.");
    }
    // Reuse the existing real D1/auth/CRUD/two-user/revocation test. Playwright
    // refuses to reuse an occupied server; migration runs only against local D1.
    await runStep(app, runtime, ["test:e2e"], "real auth, owned CRUD, isolation and revocation");
    process.stdout.write(`PASS ${fixture ? "fixture app pilot" : "Doppler dev app pilot"}\n`);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length === 1 && args[0] !== "--fixture")) {
    process.stderr.write("Usage: node scripts/doppler-app-pilot.mjs [--fixture]\n");
    process.exitCode = 1;
  } else {
    run(args[0] === "--fixture").catch(() => {
      // Even exception objects may contain child output; never echo them.
      process.stderr.write("FAIL pilot stopped; child diagnostics withheld. Report the last PASS step only.\n");
      process.exitCode = 1;
    });
  }
}
