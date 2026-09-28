// S5 deploy preflight: compares declared configuration with a target inventory
// of NAMES AND TYPES ONLY, as returned by `wrangler secret list`. It never reads
// or prints a secret value, and it runs locally without credentials.
//
//   node scripts/deploy-preflight.mjs target.json [--allow-remove NAME ...]
//
// Removing a target name is the dangerous direction: a full-set sync driven by
// the schema deletes anything the target has and the schema does not declare.
// Such a name must be listed explicitly, so an accidental deletion cannot pass.
import assert from "node:assert/strict";
import { readFileSync, realpathSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const KEY = /^([A-Z][A-Z0-9_]*)=/;
// Leading underscores are allowed because Varlock injects its own bindings, such
// as __VARLOCK_ENV_CHUNKS. Tolerating the name here only lets the planner report
// them; the artifact prefix rule decides what is actually exempt.
const NAME = /^_*[A-Z][A-Z0-9_]*$/;

/** Split declared names from @internal ones, which must never be deployed. */
export function parseSchema(text) {
  const declared = [];
  const internal = [];
  let decorators = [];
  for (const line of text.split("\n")) {
    const decorator = line.match(/^#\s*(.+)$/);
    if (decorator) {
      decorators.push(...decorator[1].split(/\s+/));
      continue;
    }
    const item = line.match(KEY);
    if (item) {
      (decorators.includes("@internal") ? internal : declared).push(item[1]);
      decorators = [];
    } else if (line.trim()) {
      decorators = [];
    }
  }
  return { declared, internal };
}

/** Accept only the name/type shape, so a value-bearing export cannot be used. */
export function parseInventory(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Inventory is not valid JSON; save the `wrangler secret list` output as JSON");
  }
  assert.ok(
    Array.isArray(parsed),
    "Inventory must be the JSON array printed by `wrangler secret list`",
  );
  for (const entry of parsed) {
    const keys = Object.keys(entry).sort();
    assert.ok(keys.includes("name"), "Every inventory entry needs a name field");
    assert.ok(
      keys.every((key) => key === "name" || key === "type"),
      "Inventory entries may contain name and optional type only; remove any value field",
    );
    assert.match(entry.name, NAME, `Unexpected inventory name: ${entry.name}`);
  }
  return parsed.map((entry) => entry.name);
}

// Bindings the pinned Varlock integration injects itself. They are not app
// configuration, so they are reported and kept rather than treated as
// undeclared names that would be deleted.
const VARLOCK_BINDING = /^__VARLOCK_|^_VARLOCK_/;

function planPreflight({ declared, internal, target, allowRemove = [] }) {
  const unwanted = target.filter((name) => !declared.includes(name));
  const undeclared = unwanted.filter((name) => !VARLOCK_BINDING.test(name));
  return {
    leaks: internal.filter((name) => target.includes(name)),
    create: declared.filter((name) => !target.includes(name)),
    keep: declared.filter((name) => target.includes(name)),
    artifacts: unwanted.filter((name) => VARLOCK_BINDING.test(name)),
    remove: undeclared.filter((name) => allowRemove.includes(name)),
    blocked: undeclared.filter((name) => !allowRemove.includes(name)),
    unknownAllowance: allowRemove.filter((name) => !undeclared.includes(name)),
  };
}

export function checkPreflight(inputs) {
  const plan = planPreflight(inputs);
  assert.deepEqual(
    plan.leaks,
    [],
    `Internal item must never reach the target: ${plan.leaks.join(", ")}`,
  );
  assert.deepEqual(
    plan.blocked,
    [],
    `Undeclared target name needs explicit --allow-remove: ${plan.blocked.join(", ")}`,
  );
  assert.deepEqual(
    plan.unknownAllowance,
    [],
    `--allow-remove names nothing that would be removed: ${plan.unknownAllowance.join(", ")}`,
  );
  return plan;
}

function main([inventoryPath, ...rest]) {
  const allowRemove = [];
  for (let index = 0; index < rest.length; index += 2) {
    assert.equal(rest[index], "--allow-remove", `Unexpected argument: ${rest[index]}`);
    assert.ok(rest[index + 1], "--allow-remove needs a name");
    allowRemove.push(rest[index + 1]);
  }
  const root = resolve(import.meta.dirname, "..");
  const { declared, internal } = parseSchema(readFileSync(resolve(root, ".env.schema"), "utf8"));
  const target = parseInventory(readFileSync(resolve(inventoryPath), "utf8"));
  const plan = checkPreflight({ declared, internal, target, allowRemove });
  const report = (label, names) => {
    if (names.length) process.stdout.write(`${label}: ${names.join(", ")}\n`);
  };
  // The inventory lists secrets only, so a declared name missing here may simply
  // be a non-sensitive var. The label must not claim a create or update.
  report("Declared name that is not a secret (var, or missing)", plan.create);
  report("Varlock-injected binding (kept)", plan.artifacts);
  report("Approved removal", plan.remove);
  process.stdout.write(
    `Names checked: ${declared.length} declared, ${target.length} in target, ${internal.length} internal\n`,
  );
  // Success-only marker: printed after every assertion above has passed.
  process.stdout.write("Deploy preflight passed\n");
}

// See check-portable.mjs: real paths matter, because an exported copy often
// lives under a symlinked temporary directory on macOS.
function invokedDirectly() {
  try {
    return (
      Boolean(process.argv[1]) &&
      realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
    );
  } catch {
    return false;
  }
}

if (invokedDirectly()) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`Deploy preflight failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}
