import { readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(process.argv[2] ?? "dist");
const canaries = [
  ["synthetic auth fixture", "test-only-fenod-fixture-auth-secret-not-for-deployment"],
  ["internal token", process.env.DOPPLER_TOKEN],
].filter((entry) => entry[1]);
const leaks = [];

function scan(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) scan(path);
    else {
      const content = readFileSync(path, "utf8");
      for (const [label, canary] of canaries) {
        if (content.includes(canary)) leaks.push(`${label} in ${relative(root, path)}`);
      }
    }
  }
}

scan(root);
if (leaks.length > 0) {
  process.stderr.write(`Build canary scan failed:\n${leaks.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write("Build canary scan passed.\n");
}
