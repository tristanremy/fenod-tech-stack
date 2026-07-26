import { defineConfig } from "oxlint";
import core from "ultracite/oxlint/core";

// Smoke reference: Ultracite core on law-owned paths; ignore scaffold demos/noise.
export default defineConfig({
  extends: [core],
  ignorePatterns: [
    ...(core.ignorePatterns ?? []),
    "src/routes/demo/**",
    "src/routes/api.$.ts",
    "src/routes/api.rpc.$.ts",
    "src/routes/api/**",
    "src/components/**",
    "src/integrations/**",
    "src/polyfill.ts",
    "src/routeTree.gen.ts",
    "drizzle/**",
  ],
  rules: {
    "eslint/func-style": "off",
    "eslint/sort-keys": "off",
    "eslint/no-use-before-define": "off",
    "eslint/arrow-body-style": "off",
    "unicorn/filename-case": "off",
    "react/no-danger": "off",
  },
});
