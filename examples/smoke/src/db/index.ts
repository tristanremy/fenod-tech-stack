import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";

import * as schema from "./schema.ts";

/** D1-backed Drizzle client. Call only from server functions / Workers code. */
export const getDb = () => drizzle(env.DB, { schema });
