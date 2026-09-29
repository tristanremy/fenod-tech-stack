import { readdirSync } from "node:fs";
import { varlockCloudflareVitePlugin } from "@varlock/cloudflare-integration";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { findLocalConfigConflicts } from "./src/config-policy.ts";

// Never silently load a developer's old secrets into the fixture-only pilot.
const localFiles = readdirSync(import.meta.dirname);
if (!localFiles.includes(".env.schema")) {
  throw new Error("S2 requires the tracked .env.schema fixture.");
}
const conflicts = findLocalConfigConflicts(localFiles);
if (conflicts.length > 0) {
  throw new Error(
    `S2 is fixture-only. Move these overrides outside the app before running Vite; do not delete their values: ${conflicts.join(", ")}`,
  );
}

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    varlockCloudflareVitePlugin({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
});

export default config;
