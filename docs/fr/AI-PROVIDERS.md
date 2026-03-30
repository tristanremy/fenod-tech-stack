# Providers IA

Executez des modeles IA depuis Workers en utilisant le bon provider pour chaque tache. L'inference native Cloudflare est le choix par defaut; routagez vers des providers externes quand vous avez besoin de modeles specifiques, de fallbacks ou d'observabilite centralisee.

## Vue d'Ensemble des Providers

| Provider | Utiliser quand |
|----------|----------------|
| **Workers AI** (`workers-ai-provider`) | Par defaut pour l'inference edge Cloudflare. Pas de latence de routage hors du reseau CF. |
| **Cloudflare AI Gateway** (`ai-gateway-provider`) | Vous avez besoin de cache, de retries, de fallback entre providers ou d'observabilite unifiee. |
| **Replicate** (`@ai-sdk/replicate` ou via AI Gateway) | Modeles de generation d'images non disponibles sur Workers AI. |

## Workers AI

Inference GPU serverless sur le reseau Cloudflare. Disponible directement depuis Workers avec un binding `ai`.

### Setup

```bash
pnpm add workers-ai-provider
```

```jsonc
// wrangler.jsonc
{
  "ai": { "binding": "AI" }
}
```

```ts
import { createWorkersAI } from "workers-ai-provider";
import { generateText, streamText } from "ai";

type Env = { AI: Ai };

export default {
  async fetch(_: Request, env: Env) {
    const workersai = createWorkersAI({ binding: env.AI });

    const result = await generateText({
      model: workersai("@cf/meta/llama-3.1-8b-instruct"),
      prompt: "Explain edge computing in one sentence.",
    });

    return new Response(result.text);
  },
};
```

### Sortie Structuree

```ts
import { createWorkersAI } from "workers-ai-provider";
import { generateText, Output } from "ai";
import { z } from "zod";

const workersai = createWorkersAI({ binding: env.AI });

const result = await generateText({
  model: workersai("@cf/meta/llama-3.1-8b-instruct"),
  prompt: "Generate a lasagna recipe",
  output: Output.object({
    schema: z.object({
      recipe: z.object({
        ingredients: z.array(z.string()),
        description: z.string(),
      }),
    }),
  }),
});

return Response.json(result.output);
```

### Reponse en Streaming

```ts
const result = streamText({
  model: workersai("@cf/meta/llama-3.1-8b-instruct"),
  prompt: "Write a haiku about cloud computing.",
});

return result.toTextStreamResponse({
  headers: {
    "Content-Type": "text/x-unknown",
    "content-encoding": "identity",
    "transfer-encoding": "chunked",
  },
});
```

## Cloudflare AI Gateway

Routagez les requetes vers plusieurs providers a travers une seule passerelle. Obtenez cache, retries, limitation de taux et fallback sans changer les sites d'appel.

### Setup

```bash
pnpm add ai-gateway-provider
```

```ts
import { createAiGateway } from "ai-gateway-provider";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";

const aigateway = createAiGateway({
  accountId: env.CLOUDFLARE_ACCOUNT_ID,
  gateway: "my-gateway",
  apiKey: env.CLOUDFLARE_API_KEY,
});

const anthropic = createAnthropic({ apiKey: env.ANTHROPIC_API_KEY });
const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });

const model = aigateway([
  anthropic("claude-haiku-4-5"),
  openai("gpt-4o-mini"),
]);
```

### Options par Requete

```ts
const result = await generateText({
  model,
  prompt: "Classify this email as urgent or not.",
  providerOptions: {
    aigateway: {
      cacheTtl: 3600,
      skipCache: false,
      retries: { maxAttempts: 3, backoff: "exponential" },
      metadata: { userId: "user-123" },
    },
  },
});
```

### Providers Supportes via AI Gateway

| Provider | Modeles |
|----------|---------|
| OpenAI | GPT-4o, GPT-4o-mini, o1, o3 |
| Anthropic | Claude 3.5, Claude 3 |
| DeepSeek | DeepSeek Chat |
| Google AI | Gemini |
| Grok | Modeles xAI |
| Mistral | Modeles Mistral |
| Perplexity | Sonar |
| Replicate | Flux, Ideogram, Stable Diffusion |
| Groq | Llama, Mixtral |

## Replicate

Le meilleur choix pour les modeles de generation d'images non disponibles sur Workers AI. Utilisez directement via `@ai-sdk/replicate` pour les workflows axes image, ou routage via AI Gateway pour le cache et le fallback.

### Setup Direct

```bash
pnpm add @ai-sdk/replicate
```

```ts
import { replicate } from "@ai-sdk/replicate";
import { generateImage } from "ai";

const { image } = await generateImage({
  model: replicate.image("black-forest-labs/flux-schnell"),
  prompt: "A golden retriever getting a manicure in a futuristic salon",
  aspectRatio: "16:9",
});

await writeFile("image.webp", image.uint8Array);
```

### Via AI Gateway

```ts
import { createAiGateway } from "ai-gateway-provider";
import { createReplicate } from "@ai-sdk/replicate";

const aigateway = createAiGateway({
  accountId: env.CLOUDFLARE_ACCOUNT_ID,
  gateway: "my-gateway",
  apiKey: env.CLOUDFLARE_API_KEY,
});

const replicate = createReplicate({ apiKey: env.REPLICATE_API_TOKEN });

const model = aigateway([replicate.image("recraft-ai/recraft-v3")]);
```

### Edition d'Image

```ts
const inputImage = readFileSync("./input.png");
const mask = readFileSync("./mask.png");

const { images } = await generateImage({
  model: replicate.image("black-forest-labs/flux-fill-pro"),
  prompt: {
    text: "Replace the background with a sunset over mountains",
    images: [inputImage],
    mask: mask,
  },
  providerOptions: {
    replicate: {
      guidance_scale: 7.5,
      num_inference_steps: 30,
    },
  },
});
```

## Selection de Modele par Tache

### Generation de Texte / Raisonnement

| Modele | Provider | Ideal pour |
|--------|----------|------------|
| `@cf/meta/llama-3.1-8b-instruct` | Workers AI | Rapide, economique, inference edge |
| `@cf/meta/llama-3.1-70b-instruct` | Workers AI | Qualite superieure, serverless |
| `kimi-k2.5` | Workers AI | Long contexte (256k), tool calling, vision |
| `gpt-oss-120b` | Workers AI | Open-weight, haut raisonnement |
| `mistral-small-3.1-24b-instruct` | Workers AI | Vision + long contexte (128k) |
| `qwen3-30b-a3b-fp8` | Workers AI | Raisonnement, function calling, multilingue |
| `deepseek-r1-distill-qwen-32b` | Workers AI | Benchmarks de raisonnement eleves |
| `qwq-32b` | Workers AI | Raisonnement chain-of-thought |
| `llama-4-scout-17b-16e-instruct` | Workers AI | Multimodal MoE, 16 experts |

### Generation de Code

| Modele | Provider | Ideal pour |
|--------|----------|------------|
| `@cf/qwen/qwen2.5-coder-32b-instruct` | Workers AI | Specifique au code, 32B params |
| `@cf/meta/llama-3.1-8b-instruct` | Workers AI | Assistance code legere |

### Embeddings Texte

| Modele | Provider | Ideal pour |
|--------|----------|------------|
| `@cf/baai/bge-base-en-v1.5` | Workers AI | Embeddings anglais generaux |
| `@cf/baai/bge-large-en-v1.5` | Workers AI | Embeddings de meilleure qualite |
| `@cf/google/gemma-3-embedding-300m` | Workers AI | Leger, multilingue |
| `@cf/qwen/qwen3-embedding-0.6b` | Workers AI | Embedding compact |

### Reranking

| Modele | Provider |
|--------|----------|
| `@cf/baai/bge-reranker-base` | Workers AI |

### Generation d'Images

| Modele | Provider | Ideal pour |
|--------|----------|------------|
| `@cf/black-forest-labs/flux-2-klein-9b` | Workers AI | Distille rapide, interactif |
| `@cf/black-forest-labs/flux-2-dev` | Workers AI | Haute qualite, multi-reference |
| `@cf/Flux.1/schnell` | Workers AI | Rapidite (1-4 etapes) |
| `black-forest-labs/flux-1.1-pro-ultra` | Replicate | Qualite maximale, cout eleve |
| `black-forest-labs/flux-schnell` | Replicate | Travail local/image rapide |
| `recraft-ai/recraft-v3` | Replicate | Generation SVG |
| `ideogram-ai/ideogram-v2-turbo` | Replicate | Rendu de texte dans les images |
| `luma/photon` | Replicate | Generation photorealiste |
| `stability-ai/stable-diffusion-3.5-large` | Replicate | Compositions complexes |

### Parole / Audio

| Modele | Provider | Ideal pour |
|--------|----------|------------|
| `@cf/openai/whisper-large-v3-turbo` | Workers AI | Reconnaissance vocale, multilingue |
| `@cf/deepgram/nova-3` | Workers AI | ASR rapide |
| `@cf/deepgram/aura-2-en` | Workers AI | TTS naturel |
| `@cf/myshell-ai/melotts` | Workers AI | TTS multilingue leger |
| `@cf/deepgram/flux` | Workers AI | Parole conversationnelle |

### Vision / Multimodal

| Modele | Provider | Ideal pour |
|--------|----------|------------|
| `@cf/meta/llama-3.2-11b-vision-instruct` | Workers AI | Comprehension d'images |
| `@cf/google/gemma-3-12b-it` | Workers AI | Multimodal, 140+ langues |
| `@cf/llava-hf/llava-1.5-7b-hf` | Workers AI | Image vers texte (beta) |
| `kimi-k2.5` | Workers AI | Contexte long, tool calling, vision |

## Quand Utiliser Quoi

### Par defaut: Workers AI
- Votre cible d'inference principale.
- Pas de latence de routage externe.
- Serverless, paiement a l'utilisation, pas de gestion GPU.

### Ajouter AI Gateway quand vous avez besoin de:
- Cache pour reduire le cout sur les invites repetees.
- Logique de retry avec backoff exponentiel.
- Fallback automatique entre modeles ou providers.
- Observabilite unifiee sur tous les appels IA.
- Routage multi-provider sans changer les sites d'appel.

### Utiliser Replicate quand vous avez besoin de:
- Des modeles non disponibles sur Workers AI (Flux Pro, Ideogram V2, Recraft V3, etc.).
- Des capacites de generation d'image specifiques (inpainting, multi-reference, styles affines).
- Une generation d'image en gros volume ou les prix Replicate sont plus adaptes.

### Utiliser Replicate via AI Gateway quand:
- Vous voulez cache et retries sur les appels de generation d'image.
- Vous avez besoin de fallback de Replicate vers Workers AI pour les taches de texte.
- Vous voulez des logs centralisees sur tous les providers.

## Guides Lies

- [Les Primitives de Calcul Cloudflare](./CLOUDFLARE-COMPUTE.md)
- [Patterns de Code](./CODE-PATTERNS.md)
- [MCP avec Claude Code](./MCP-GUIDE.md)
- [Workers AI Models](https://developers.cloudflare.com/workers-ai/models/)
- [AI Gateway Docs](https://developers.cloudflare.com/ai-gateway/)
- [Replicate Provider](https://ai-sdk.dev/providers/ai-sdk-providers/replicate)
- [Cloudflare Workers AI Provider](https://ai-sdk.dev/providers/community-providers/cloudflare-workers-ai)
