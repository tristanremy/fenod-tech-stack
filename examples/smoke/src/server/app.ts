import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { SmartCoercionPlugin } from "@orpc/json-schema";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { Hono } from "hono";

import { auth, getSession } from "#/lib/auth";
import type { AuthSession } from "#/lib/auth";
import router from "#/orpc/router";
import { TodoSchema } from "#/orpc/schema";

type AppEnv = {
  Variables: {
    session: AuthSession;
  };
};

const rpcHandler = new RPCHandler(router);
const openApiHandler = new OpenAPIHandler(router, {
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
  plugins: [
    new SmartCoercionPlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
    }),
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
      specGenerateOptions: {
        info: {
          title: "TanStack ORPC Playground",
          version: "1.0.0",
        },
        commonSchemas: {
          Todo: { schema: TodoSchema },
          UndefinedError: { error: "UndefinedError" },
        },
        security: [{ bearerAuth: [] }],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
            },
          },
        },
      },
      docsConfig: {
        authentication: {
          securitySchemes: {
            bearerAuth: {
              token: "default-token",
            },
          },
        },
      },
    }),
  ],
});

const app = new Hono<AppEnv>();

app.all("/api/auth/*", (c) => auth.handler(c.req.raw));

app.use("/api/rpc/*", async (c, next) => {
  c.set("session", await getSession(c.req.raw.headers));
  await next();
});

app.use("/api/rpc/*", async (c) => {
  const { matched, response } = await rpcHandler.handle(c.req.raw, {
    prefix: "/api/rpc",
    context: { session: c.get("session") },
  });

  if (matched && response) {
    return c.newResponse(response.body, response);
  }

  return c.text("Not Found", 404);
});

app.use("/api/*", async (c) => {
  const { matched, response } = await openApiHandler.handle(c.req.raw, {
    prefix: "/api",
    context: { session: null },
  });

  if (matched && response) {
    return c.newResponse(response.body, response);
  }

  return c.text("Not Found", 404);
});

export default app;
