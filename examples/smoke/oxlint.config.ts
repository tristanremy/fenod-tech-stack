import { defineConfig } from "oxlint";

// React Compiler recommended rules live in correctness via the react plugin.
// Do not set react/react-compiler — that nursery rule is gone.
export default defineConfig({
  plugins: ["react"],
  categories: {
    correctness: "error",
  },
  ignorePatterns: [
    "src/routes/demo/**",
    "src/routeTree.gen.ts",
    "worker-configuration.d.ts",
    "drizzle/**",
    "dist/**",
    ".wrangler/**",
    "node_modules/**",
  ],
});
