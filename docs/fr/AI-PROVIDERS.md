# AI Providers

[Available in English](../AI-PROVIDERS.md)

Run AI models from Workers using the right provider for the task. Cloudflare-native inference is the default; use TanStack AI for application-level chat, streaming, tools, and agent state, then route to external providers when you need specific models, fallbacks, or centralized observability.

## Provider Overview

| Provider | Use when |
|----------|----------|
| **Workers AI** (`@cloudflare/tanstack-ai`) | Default for Cloudflare edge inference. No latency from routing outside CF network. |
| **Cloudflare AI Gateway** (`@cloudflare/tanstack-ai`) | You need caching, retries, fallback between providers, or unified observability. |
| **Replicate** (TanStack AI adapter or via AI Gateway) | Image generation models not available on Workers AI. |

## Workers AI

Serverless GPU inference on Cloudflare's network. Available directly from Workers with an `ai` binding.

### Setup

```bash
pnpm add @tanstack/ai @cloudflare/tanstack-ai
```

```jsonc
// wrangler.jsonc
{
  "ai": { "binding": "AI" }
}
```

```ts
import { chat, streamToText } from "@tanstack/ai";
import { createWorkersAiChat } from "@cloudflare/tanstack-ai";

type Env = { AI: Ai };

export default {
  async fetch(_: Request, env: Env) {
    const stream = chat({
      adapter: createWorkersAiChat("@cf/meta/llama-3.1-8b-instruct", { binding: env.AI }),
      messages: [{ role: "user", content: "Explain edge computing in one sentence." }],
    });

    return new Response(await streamToText(stream));
  },
};
```

### Structured Output

```ts
import { chat, streamToText } from "@tanstack/ai";
import { createWorkersAiChat } from "@cloudflare/tanstack-ai";
import { z } from "zod";

const RecipeSchema = z.object({
  recipe: z.object({
    ingredients: z.array(z.string()),
    description: z.string(),
  }),
});

const stream = chat({
  adapter: createWorkersAiChat("@cf/meta/llama-3.1-8b-instruct", { binding: env.AI }),
  messages: [{ role: "user", content: "Generate a lasagna recipe as JSON." }],
});

return Response.json(RecipeSchema.parse(JSON.parse(await streamToText(stream))));
```

### Streaming Response

```ts
import { chat, toServerSentEventsResponse } from "@tanstack/ai";
import { createWorkersAiChat } from "@cloudflare/tanstack-ai";

const stream = chat({
  adapter: createWorkersAiChat("@cf/meta/llama-3.1-8b-instruct", { binding: env.AI }),
  messages: [{ role: "user", content: "Write a haiku about cloud computing." }],
});

return toServerSentEventsResponse(stream);
```

## Cloudflare AI Gateway

Route requests to multiple providers through a single gateway. Get caching, retries, rate limiting, and fallback without changing call sites.

### Setup

```bash
pnpm add @tanstack/ai @cloudflare/tanstack-ai
```

```ts
import { createAnthropicChat, createOpenAiChat } from "@cloudflare/tanstack-ai";

const claude = createAnthropicChat("claude-haiku-4-5", {
  binding: env.AI.gateway("my-gateway"),
  apiKey: env.ANTHROPIC_API_KEY,
});

const gpt = createOpenAiChat("gpt-4o-mini", {
  binding: env.AI.gateway("my-gateway"),
  apiKey: env.OPENAI_API_KEY,
});

// Keep fallback selection in application code so behavior is explicit.
const adapters = [claude, gpt];
```

### Request Options

```ts
import { chat } from "@tanstack/ai";
import { createWorkersAiChat } from "@cloudflare/tanstack-ai";

const stream = chat({
  adapter: createWorkersAiChat("@cf/meta/llama-3.1-8b-instruct", {
    binding: env.AI.gateway("my-gateway"),
    gateway: {
      cacheTtl: 3600,
      skipCache: false,
    },
  }),
  messages: [{ role: "user", content: "Classify this email as urgent or not." }],
});
```

### Supported Providers via AI Gateway

| Provider | Models |
|----------|--------|
| OpenAI | GPT-4o, GPT-4o-mini, o1, o3 |
| Anthropic | Claude 3.5, Claude 3 |
| DeepSeek | DeepSeek Chat |
| Google AI | Gemini |
| Grok | xAI models |
| Mistral | Mistral models |
| Perplexity | Sonar |
| Replicate | Flux, Ideogram, Stable Diffusion |
| Groq | Llama, Mixtral |

## Replicate

Best for image generation models not on Workers AI. Prefer routing Replicate through Cloudflare AI Gateway for caching, fallback, and centralized observability. If a direct TanStack AI adapter is not available for the exact image workflow, call Replicate from a narrow server-side service instead of adding a second AI toolkit just for images.

### Via AI Gateway

```ts
import { createOpenAiChat } from "@cloudflare/tanstack-ai";

// For OpenAI-compatible image providers routed through AI Gateway, keep the
// gateway configuration in one server-side adapter module.
const imageAdapter = createOpenAiChat("recraft-ai/recraft-v3", {
  binding: env.AI.gateway("my-gateway"),
  apiKey: env.REPLICATE_API_TOKEN,
});
```

### Direct Service Fallback

```ts
const response = await fetch("https://api.replicate.com/v1/predictions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${env.REPLICATE_API_TOKEN}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    version: "black-forest-labs/flux-fill-pro",
    input: {
      prompt: "Replace the background with a sunset over mountains",
      image: inputImageUrl,
      mask: maskImageUrl,
      guidance_scale: 7.5,
      num_inference_steps: 30,
    },
  }),
});
```

## Model Selection by Task

### Text Generation / Reasoning

| Model | Provider | Best for |
|-------|----------|----------|
| `@cf/meta/llama-3.1-8b-instruct` | Workers AI | Fast, cheap, edge inference |
| `@cf/meta/llama-3.1-70b-instruct` | Workers AI | Higher quality, still serverless |
| `kimi-k2.5` | Workers AI | Long context (256k), tool calling, vision |
| `gpt-oss-120b` | Workers AI | Open-weight, high reasoning |
| `mistral-small-3.1-24b-instruct` | Workers AI | Vision + long context (128k) |
| `qwen3-30b-a3b-fp8` | Workers AI | Reasoning, function calling, multilingual |
| `deepseek-r1-distill-qwen-32b` | Workers AI | Strong reasoning benchmarks |
| `qwq-32b` | Workers AI | Chain-of-thought reasoning |
| `llama-4-scout-17b-16e-instruct` | Workers AI | Multimodal MoE, 16 experts |

### Code Generation

| Model | Provider | Best for |
|-------|----------|----------|
| `@cf/qwen/qwen2.5-coder-32b-instruct` | Workers AI | Code-specific, 32B params |
| `@cf/meta/llama-3.1-8b-instruct` | Workers AI | Lightweight code assist |

### Text Embeddings

| Model | Provider | Best for |
|-------|----------|----------|
| `@cf/baai/bge-base-en-v1.5` | Workers AI | General English embeddings |
| `@cf/baai/bge-large-en-v1.5` | Workers AI | Higher quality embeddings |
| `@cf/google/gemma-3-embedding-300m` | Workers AI | Lightweight, multilingual |
| `@cf/qwen/qwen3-embedding-0.6b` | Workers AI | Compact embedding |

### Reranking

| Model | Provider |
|-------|----------|
| `@cf/baai/bge-reranker-base` | Workers AI |

### Image Generation

| Model | Provider | Best for |
|-------|----------|----------|
| `@cf/black-forest-labs/flux-2-klein-9b` | Workers AI | Fast distilled, interactive |
| `@cf/black-forest-labs/flux-2-dev` | Workers AI | High quality, multi-reference |
| `@cf/Flux.1/schnell` | Workers AI | Speed (1-4 steps) |
| `black-forest-labs/flux-1.1-pro-ultra` | Replicate | Highest quality, high cost |
| `black-forest-labs/flux-schnell` | Replicate | Fast local/image work |
| `recraft-ai/recraft-v3` | Replicate | SVG generation |
| `ideogram-ai/ideogram-v2-turbo` | Replicate | Text rendering in images |
| `luma/photon` | Replicate | Photorealistic generation |
| `stability-ai/stable-diffusion-3.5-large` | Replicate | Complex compositions |

### Speech / Audio

| Model | Provider | Best for |
|-------|----------|----------|
| `@cf/openai/whisper-large-v3-turbo` | Workers AI | Speech-to-text, multilingual |
| `@cf/deepgram/nova-3` | Workers AI | Fast ASR |
| `@cf/deepgram/aura-2-en` | Workers AI | Natural TTS |
| `@cf/myshell-ai/melotts` | Workers AI | Lightweight multilingual TTS |
| `@cf/deepgram/flux` | Workers AI | Conversational speech |

### Vision / Multimodal

| Model | Provider | Best for |
|-------|----------|----------|
| `@cf/meta/llama-3.2-11b-vision-instruct` | Workers AI | Image understanding |
| `@cf/google/gemma-3-12b-it` | Workers AI | Multimodal, 140+ languages |
| `@cf/llava-hf/llava-1.5-7b-hf` | Workers AI | Image-to-text (beta) |
| `kimi-k2.5` | Workers AI | Long context, tool calling, vision |

## When to Use Which

### Default: Workers AI
- Your primary inference target.
- No external routing latency.
- Serverless, pay-per-request, no GPU management.

### Add AI Gateway when you need:
- Caching to reduce cost on repeated prompts.
- Retry logic with exponential backoff.
- Automatic fallback between models or providers.
- Unified observability across all AI calls.
- Multi-provider routing without changing call sites.

### Use Replicate when you need:
- Models not on Workers AI (Flux Pro, Ideogram V2, Recraft V3, etc.).
- Specific image generation capabilities (inpainting, multi-reference, fine-tuned styles).
- High-volume image generation where Replicate's pricing fits better.

### Use Replicate via AI Gateway when:
- You want caching and retries on image generation calls.
- You need fallback from Replicate to Workers AI for text tasks.
- You want centralized logs across all providers.

## Related Guides

- [Cloudflare Compute](./CLOUDFLARE-COMPUTE.md)
- [Code Patterns](./CODE-PATTERNS.md)
- [MCP Guide](./MCP-GUIDE.md)
- [Workers AI Models](https://developers.cloudflare.com/workers-ai/models/)
- [AI Gateway Docs](https://developers.cloudflare.com/ai-gateway/)
- [TanStack AI](https://tanstack.com/ai)
- [TanStack AI Cloudflare adapter](https://tanstack.com/ai/latest/docs/community-adapters/cloudflare)
- [Cloudflare AI package](https://github.com/cloudflare/ai)
