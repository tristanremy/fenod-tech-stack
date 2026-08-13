import { defineConfig } from "oxlint";

// Law-owned paths are linted. Scaffold demo UI stays ignored.
export default defineConfig({
  ignorePatterns: [
    "src/routes/demo/**",
    "src/components/**",
    "src/integrations/**",
    "src/routeTree.gen.ts",
    "worker-configuration.d.ts",
    "drizzle/**",
    "dist/**",
    ".wrangler/**",
    "node_modules/**",
  ],
});
