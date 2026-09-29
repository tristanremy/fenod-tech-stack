import { readFileSync, writeFileSync } from "node:fs";

const path = new URL("../worker-configuration.d.ts", import.meta.url);
const source = readFileSync(path, "utf8");
const normalized = source.replace(/wrangler types --env-file=[^`]+/u, "varlock-wrangler types");
if (normalized === source)
  throw new Error("Wrangler type header format changed; update the normalizer.");
writeFileSync(path, normalized);
