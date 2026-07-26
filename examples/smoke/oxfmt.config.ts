import { defineConfig } from "oxfmt";
import ultracite from "ultracite/oxfmt";

export default defineConfig({
  ...ultracite,
  ignorePatterns: [
    ...((ultracite as { ignorePatterns?: string[] }).ignorePatterns ?? []),
    "src/routeTree.gen.ts",
    "drizzle/**",
    "pnpm-lock.yaml",
  ],
});
