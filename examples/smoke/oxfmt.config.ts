import { defineConfig } from "oxfmt";

export default defineConfig({
  ignorePatterns: [
    "src/routeTree.gen.ts",
    "worker-configuration.d.ts",
    "drizzle/**",
    "pnpm-lock.yaml",
  ],
});
