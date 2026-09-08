import { defineConfig } from "astro/config";
import { publicOrigin } from "./src/lib/site.ts";

export default defineConfig({
  site: publicOrigin,
  output: "static",
  trailingSlash: "always",
  server: { port: process.env.PORT ? Number(process.env.PORT) : undefined },
  devToolbar: { enabled: false },
});
