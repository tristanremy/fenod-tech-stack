import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";

it("allows Button layout but rejects restyling with actionable lint feedback", () => {
  // Keep deliberate violations out of concurrent lint/typecheck scans.
  const directory = mkdtempSync(join(process.cwd(), "lint-fixture-"));
  const file = join(directory, "button.tsx");
  try {
    for (const [className, status] of [
      ["w-full mt-4", 0],
      ["p-4", 1],
    ] as const) {
      writeFileSync(
        file,
        `import { Button } from "#/components/ui/button";\nexport const Example = () => <Button className="${className}">Save</Button>;\n`,
      );
      const result = spawnSync("pnpm", ["exec", "oxlint", "--no-ignore", file], {
        encoding: "utf8",
        timeout: 15_000,
      });
      expect(result.error).toBeUndefined();
      expect(result.status, result.stdout + result.stderr).toBe(status);
      if (status === 1) expect(result.stdout + result.stderr).toContain("no-restyle");
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}, 40_000);
