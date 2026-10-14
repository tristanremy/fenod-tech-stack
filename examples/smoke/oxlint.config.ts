import { defineConfig } from "oxlint";

// React Compiler recommended rules live in correctness via the react plugin.
// Do not set react/react-compiler — that nursery rule is gone.
export default defineConfig({
  plugins: ["react", "typescript"],
  jsPlugins: ["@shadcn/lint"],
  rules: {
    "shadcn/no-restyle": ["error", { allow: ["layout"] }],
    // Casts, any and ! hide what the types promise; see docs/review-guide.md.
    "typescript/consistent-type-assertions": ["error", { assertionStyle: "never" }],
    "typescript/no-explicit-any": "error",
    "typescript/no-non-null-assertion": "error",
  },
  overrides: [
    {
      // Installed shadcn source stays unmodified; official items use casts.
      files: ["src/components/ui/**"],
      rules: {
        "shadcn/no-restyle": "off",
        "typescript/consistent-type-assertions": "off",
        "typescript/no-non-null-assertion": "off",
      },
    },
  ],
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
