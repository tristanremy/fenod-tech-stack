import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function checkWorkflow(text) {
  const uses = [...text.matchAll(/^\s*(?:-\s*)?uses:\s*["']?([^\s"'#]+)["']?/gm)];
  assert.ok(uses.length, "Workflow must declare pinned actions");
  for (const [, action] of uses) assert.match(action, /^[^@]+@[a-f0-9]{40}$/i, "Unpinned action");
  if (text.includes("ghcr.io/gitleaks/gitleaks@sha256:")) {
    const digest = [
      text.match(/GITLEAKS_DIGEST_A: ([a-f0-9]{32})/)?.[1],
      text.match(/GITLEAKS_DIGEST_B: ([a-f0-9]{32})/)?.[1],
    ].join("");
    assert.match(digest, /^[a-f0-9]{64}$/, "Unpinned Gitleaks image");
  }
  assert.match(text, /contents: read/, "Workflow needs read-only permissions");
  assert.match(text, /persist-credentials: false/, "Checkout must not persist credentials");
  assert.doesNotMatch(
    text,
    /pull_request_target|secrets\.|secrets: inherit|write-all|contents: write|id-token: write/,
    "Privileged workflow",
  );
}

export function checkPortable(root) {
  const read = (path) => readFileSync(join(root, path), "utf8");
  let manifest;
  try {
    manifest = JSON.parse(read("package.json"));
  } catch (cause) {
    throw new Error("Invalid starter package.json", { cause });
  }
  assert.equal(manifest.private, true);
  assert.match(manifest.packageManager, /^pnpm@\d+\.\d+\.\d+$/);
  assert.equal(manifest.engines.node, ">=24");
  for (const doc of ["AGENTS.md", "README.md", "STACK.md"]) {
    const text = read(doc);
    assert.match(
      text,
      /\/blob\/(?:UPSTREAM_REVISION|[a-f0-9]{40})\//,
      `Missing immutable upstream link: ${doc}`,
    );
    assert.doesNotMatch(text, /\/blob\/(?:main|master)\//, `Moving upstream link: ${doc}`);
    for (const [, link] of text.matchAll(/\]\(([^\s)]+)\)/g)) {
      if (/^https:\/\//.test(link) || link.startsWith("#")) continue;
      const path = resolve(root, dirname(doc), link.split("#")[0]);
      assert.ok(!relative(root, path).startsWith(".."), `Escaping doc link: ${link}`);
      assert.ok(existsSync(path), `Missing doc link: ${link}`);
    }
    const commands = [...text.matchAll(/```(?:bash|sh)?\n([\s\S]*?)```|`([^`\n]+)`/g)]
      .map((match) => match[1] ?? match[2])
      .join("\n");
    for (const [, command] of commands.matchAll(/\bpnpm (?:run )?([\w:-]+)/g)) {
      if (["install", "exec", "dlx", "audit"].includes(command)) continue;
      assert.ok(manifest.scripts[command], `Unknown documented script: ${command}`);
    }
  }
  assert.equal(manifest.scripts.deploy, "node scripts/local-only.mjs");
  assert.equal(manifest.scripts["db:remote"], "node scripts/local-only.mjs");
  assert.equal(manifest.scripts["generate-routes"], "pnpm build");
  const worker = read("wrangler.jsonc");
  const workerName = worker.match(/"name":\s*"([^"]+)"/)[1];
  const databaseName = worker.match(/"database_name":\s*"([^"]+)"/)[1];
  assert.equal(workerName, manifest.name, "Worker/package names drifted");
  assert.equal(databaseName, manifest.name, "Database/package names drifted");
  assert.ok(
    manifest.scripts["db:local"].includes(`apply ${databaseName} --local`),
    "Migration target drifted",
  );
  const keys = [...read(".env.schema").matchAll(/^([A-Z][A-Z_]+)=/gm)]
    .map((m) => m[1])
    .filter((key) => key !== "DOPPLER_TOKEN");
  const types = read("worker-configuration.d.ts").split("declare namespace Cloudflare")[0];
  for (const key of [...keys, "DB"])
    assert.match(types, new RegExp(`\\b${key}:`), `Missing Worker binding ${key}`);
  assert.doesNotMatch(types, /DOPPLER_TOKEN|varlock-types-env-/, "Internal/unstable Worker types");
  const workflows = readdirSync(join(root, ".github/workflows"))
    .filter((file) => /\.ya?ml$/.test(file))
    .map((file) => read(`.github/workflows/${file}`));
  assert.ok(
    workflows.some((text) => text.includes("ghcr.io/gitleaks/gitleaks@sha256:")),
    "CI needs a digest-pinned offline secret scan",
  );
  for (const workflow of workflows) checkWorkflow(workflow);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  checkPortable(resolve(import.meta.dirname, ".."));
  process.stdout.write("Portable starter contract passed\n");
}
