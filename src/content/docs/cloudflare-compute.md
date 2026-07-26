---
title: "Cloudflare Compute Primitives"
verified: 2026-06
---

[Disponible en francais](/cloudflare-compute/)

Cloudflare offers three distinct compute primitives on the Workers platform. Choosing the right one early prevents expensive migrations later.

## Decision Matrix

| Primitive | Best for | Avoid when |
|-----------|----------|------------|
| **Worker** | App logic, APIs, middleware, routing, lightweight background tasks | You need a full runtime, filesystem, or Linux environment |
| **Dynamic Worker** | Running untrusted or AI-generated code in a sandbox | You need CPU-heavy compute, a full filesystem, or existing container images |
| **Container** | Heavy workloads, existing container images, WebSocket servers, cron jobs, Region:Earth | You only need simple request handling or AI inference |

## Worker

The default primitive. Deploy JavaScript or TypeScript to Cloudflare's edge with fast cold starts and no infrastructure management.

- HTTP handling, API routes, middleware
- Background tasks via Queues or Workflows
- Durable Object stateful services
- R2, D1, KV, Vectorize bindings
- Workers AI inference
- Workers Cache for public SSR and cacheable GET responses

```ts
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return new Response("Hello from a Worker");
  },
};
```

## Dynamic Worker

Spin up isolated Workers at runtime to execute arbitrary code in a secure sandbox. The parent Worker controls which bindings the dynamic Worker receives and whether it can reach the network.

### When to Use

- **AI agent code execution**: Let an agent write and run its own tools safely.
- **Untrusted user code**: Run code submitted by users in a sandbox you control.
- **Previews and playgrounds**: Load generated code in milliseconds.
- **Custom automations**: Create tools on the fly for one-off tasks.
- **"Vibe coding"**: Run AI-generated prototypes in isolation.

### Key Features

**Capability-based security via Workers RPC**
Bindings use Cap'n Web RPC. A dynamic Worker only gets access to what you explicitly pass as a stub. If you never pass a binding, it cannot be reached.

**Egress control**
Set `globalOutbound: null` to block all outbound network access. The dynamic Worker can only use the bindings you give it. Or intercept and rewrite requests through a gateway.

**Tail Worker observability**
Attach a Tail Worker to capture `console.log`, exceptions, and request metadata from the dynamic Worker. Logs are written after the response returns, so they add no latency.

### Example: Minimal Dynamic Worker

```ts
import { getContainer } from "@cloudflare/containers";

// Dynamic Worker class
export class MyContainer extends Container {
  defaultPort = 4000;
  sleepAfter = "10m";
}

export default {
  async fetch(request, env) {
    const { "session-id": sessionId } = await request.json();
    const containerInstance = getContainer(env.MY_CONTAINER, sessionId);
    return containerInstance.fetch(request);
  },
};
```

### Wrangler Config

```jsonc
// wrangler.jsonc
{
  "name": "container-starter",
  "main": "src/index.js",
  "compatibility_date": "2026-03-30",
  "containers": [
    {
      "class_name": "MyContainer",
      "image": "./Dockerfile",
      "max_instances": 5
    }
  ],
  "durable_objects": {
    "bindings": [
      { "class_name": "MyContainer", "name": "MY_CONTAINER" }
    ]
  },
  "migrations": [
    { "new_sqlite_classes": ["MyContainer"], "tag": "v1" }
  ]
}
```

### Security Pattern: Custom Binding for Agent Sandbox

```ts
import { WorkerEntrypoint } from "cloudflare:workers";

// Define a narrow capability the agent can use
export class ChatRoom extends WorkerEntrypoint<Env, ChatRoomProps> {
  async post(text: string): Promise<void> {
    // Rewrite with bot identity before sending
    text = `[${this.ctx.props.botName}]: ${text}`;
    await postToChat(this.ctx.props.apiKey, this.ctx.props.roomName, text);
  }
}

type ChatRoomProps = {
  apiKey: string;
  roomName: string;
  botName: string;
};
```

The agent only sees the `ChatRoom.post()` method. It never sees the API key or can post to any other room.

### Security Pattern: Block All Outbound

```ts
const worker = env.LOADER.get(id, () => ({
  mainModule: "index.js",
  modules: { "index.js": code },
  globalOutbound: null, // no network access
}));
```

The dynamic Worker can only act through the bindings you pass it.

### Observability Pattern: Tail Worker

```ts
export class DynamicWorkerTail extends WorkerEntrypoint {
  async tail(events) {
    for (const event of events) {
      for (const log of event.logs) {
        console.log({
          source: "dynamic-worker-tail",
          workerId: this.ctx.props.workerId,
          level: log.level,
          message: log.message,
        });
      }
    }
  }
}

// Attach when creating the dynamic Worker
const worker = env.LOADER.get(workerId, () => ({
  mainModule: WORKER_MAIN,
  modules: { [WORKER_MAIN]: WORKER_SOURCE },
  tails: [ctx.exports.DynamicWorkerTail({ props: { workerId } })],
}));
```

## Container

Run code written in any language, built for any runtime, as part of a Workers app. Container instances spin up on-demand and are controlled by your Worker code.

**Available on Workers Paid plan.**

### When to Use

- **Resource-intensive workloads**: CPU cores in parallel, large memory or disk needs.
- **Full filesystem access**: Applications that need a real Linux-like environment.
- **Existing container images**: Tools distributed as Docker images.
- **WebSocket servers**: Long-lived connections that do not fit the Workers model.
- **Scheduled jobs**: Run a container on a cron schedule with CRON Triggers.
- **Region:Earth compliance**: Data residency requirements.

### Container Examples from Cloudflare

| Pattern | Use case |
|---------|----------|
| Static frontend + Container backend | SPA with a containerized API backend |
| Cron Container | Scheduled workloads on a cron trigger |
| Durable Object interface | Call containers directly from DOs |
| Env vars and secrets | Pass credentials securely into containers |
| Stateless instances | Scale across Cloudflare's network |
| Status hooks | React to container lifecycle events |
| Websocket to Container | Forward WebSocket connections to a container |
| R2 FUSE mount | Mount R2 buckets as filesystems inside a container |

### Wrangler Config

```jsonc
// wrangler.jsonc
{
  "name": "my-container-app",
  "main": "src/index.js",
  "compatibility_date": "2026-03-30",
  "containers": [
    {
      "class_name": "MyContainer",
      "image": "./Dockerfile",
      "max_instances": 5
    }
  ],
  "durable_objects": {
    "bindings": [
      { "class_name": "MyContainer", "name": "MY_CONTAINER" }
    ]
  }
}
```

### Basic Container Class

```ts
import { Container, getContainer } from "@cloudflare/containers";

export class MyContainer extends Container {
  defaultPort = 8080;
  sleepAfter = "5m";
}

export default {
  async fetch(request, env) {
    const id = request.headers.get("X-Session-Id") ?? "default";
    const instance = getContainer(env.MY_CONTAINER, id);
    return instance.fetch(request);
  },
};
```

## Choosing Between Dynamic Worker and Container

| Dimension | Dynamic Worker | Container |
|-----------|---------------|-----------|
| Startup speed | Sub-millisecond | Seconds to minutes |
| Runtime | V8 isolates (JavaScript/TypeScript) | Full Linux container |
| Security model | Capability-based RPC, no network by default | Network isolation configurable |
| Use code generation | Yes — agent writes code at runtime | No — image must exist beforehand |
| CPU/memory | Lightweight | Full CPU and memory access |
| Filesystem | No | Full filesystem access |
| Best fit | AI agent sandbox, untrusted code, fast previews | Existing images, heavy workloads, WebSockets |

**Rule of thumb**: use Dynamic Workers when the Worker writes or generates the code. Use Containers when you need to ship and run a pre-built image.

## Security Principles

1. **Block network by default**: Set `globalOutbound: null` and only grant access via narrow bindings.
2. **Use capability-based bindings**: Pass stubs with only the methods the Worker needs, not raw credentials.
3. **Inject credentials at the gateway**: Never expose secrets to the dynamic Worker; rewrite or inject at the boundary.
4. **Use Tail Workers for observability**: Capture logs without adding request latency.

## Related Guides

- [AI Providers](/ai-providers/)
- [Deployment Guide](/deployment/)
- [Code Patterns](/code-patterns/)
- [Cloudflare Enhancements Radar](/cloudflare-enhancements/)
- [Workers AI](https://developers.cloudflare.com/workers-ai/)
- [Dynamic Workers](https://developers.cloudflare.com/dynamic-workers/)
- [Containers](https://developers.cloudflare.com/containers/)
