import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { join, resolve } from "node:path";
import test from "node:test";

// Migrations are only proven if they apply to a clean database and if the
// statements the app issues keep working afterwards. This runs the real
// committed SQL through real SQLite, in order, with no Cloudflare account.
const drizzleDirectory = resolve(import.meta.dirname, "..", "drizzle");

function applyMigrations(db) {
  const files = readdirSync(drizzleDirectory)
    .filter((name) => name.endsWith(".sql"))
    .sort();
  assert.ok(files.length > 0, "no migration file found");
  for (const file of files) {
    const sql = readFileSync(join(drizzleDirectory, file), "utf8");
    for (const statement of sql.split("--> statement-breakpoint")) {
      if (statement.trim()) db.exec(statement);
    }
  }
  return files;
}

function openMigrated() {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON");
  const files = applyMigrations(db);
  return { db, files };
}

test("the committed migrations apply in order and leave the expected schema", () => {
  const { db, files } = openMigrated();
  try {
    assert.deepEqual(files, [
      "0000_woozy_golden_guardian.sql",
      "0001_neat_young_avengers.sql",
      "0002_mighty_stellaris.sql",
      "0003_romantic_cloak.sql",
    ]);

    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
      .all()
      .map((row) => row.name);
    for (const expected of ["items", "user", "session", "account", "verification", "rateLimit"]) {
      assert.ok(tables.includes(expected), `missing table ${expected}`);
    }
    // The public demo table was deliberately dropped by 0003.
    assert.equal(tables.includes("todos"), false);

    const indexes = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'index'")
      .all()
      .map((row) => row.name);
    assert.ok(indexes.includes("items_user_id_idx"), "owner index is required by every query");
  } finally {
    db.close();
  }
});

test("owner-scoped statements and cascade still hold on the migrated schema", () => {
  const { db } = openMigrated();
  try {
    // created_at/updated_at are NOT NULL with application-side defaults, so raw
    // SQL must supply them.
    const now = Date.now();
    const insertUser = db.prepare(
      "INSERT INTO `user` (id, name, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
    );
    insertUser.run("user-a", "Alice", "a@example.test", now, now);
    insertUser.run("user-b", "Bob", "b@example.test", now, now);

    // Statement shapes mirror src/server/items.ts exactly.
    const insertItem = db.prepare(
      "INSERT INTO `items` (`user_id`, `title`, `created_at`) VALUES (?, ?, ?)",
    );
    insertItem.run("user-a", "Alice item", now);

    const listOwned = db.prepare(
      "SELECT id, title, completed FROM `items` WHERE user_id = ? ORDER BY created_at DESC, id DESC",
    );
    assert.deepEqual(
      listOwned.all("user-a").map((row) => row.title),
      ["Alice item"],
    );
    assert.deepEqual(listOwned.all("user-b"), []);

    const otherItem = listOwned.all("user-a")[0];
    assert.ok(otherItem, "the owned item must exist");

    const updateOwned = db.prepare(
      "UPDATE `items` SET completed = ? WHERE id = ? AND user_id = ? RETURNING id, title, completed",
    );
    // A forged owner matches nothing: zero rows, no error, data unchanged.
    assert.deepEqual(updateOwned.all(1, otherItem.id, "user-b"), []);
    assert.equal(
      db.prepare("SELECT completed FROM `items` WHERE id = ?").get(otherItem.id).completed,
      0,
    );
    assert.equal(updateOwned.all(1, otherItem.id, "user-a").length, 1);

    const deleteOwned = db.prepare("DELETE FROM `items` WHERE id = ? AND user_id = ? RETURNING id");
    assert.deepEqual(deleteOwned.all(otherItem.id, "user-b"), []);
    assert.equal(listOwned.all("user-a").length, 1, "a denied delete must not remove the row");

    // Deleting the owner removes their rows; the other user is untouched.
    insertItem.run("user-b", "Bob item", now);
    db.prepare("DELETE FROM `user` WHERE id = ?").run("user-a");
    assert.deepEqual(listOwned.all("user-a"), []);
    assert.equal(listOwned.all("user-b").length, 1);
  } finally {
    db.close();
  }
});

// Negative control: the same statements must fail on a database where the
// migration has not been applied, so a passing test cannot be vacuous.
test("the owner-scoped statements fail before the migration runs", () => {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON");
  try {
    assert.throws(
      () => db.prepare("SELECT id FROM `items` WHERE user_id = ?").all("user-a"),
      /no such table/,
    );
  } finally {
    db.close();
  }
});
