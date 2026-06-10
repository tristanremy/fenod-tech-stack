---
title: "AI Providers"
verified: 2026-06
---

[Disponible en anglais](/fr/ai-providers/)

Exécutez des modèles IA depuis Workers avec le bon fournisseur pour la tâche. L’inférence native Cloudflare est le défaut ; utilisez TanStack AI pour le chat applicatif, le streaming, les outils et l’état d’agent, puis routez vers des fournisseurs externes quand vous avez besoin de modèles spécifiques, de fallbacks ou d’une observabilité centralisée.

## Vue d’ensemble des fournisseurs

| Fournisseur | À utiliser quand |
|----------|----------|
| **Workers AI** (`@cloudflare/tanstack-ai`) | Défaut pour l’inférence edge Cloudflare. Pas de latence due à un routage hors du réseau CF. |
| **Cloudflare AI Gateway** (`@cloudflare/tanstack-ai`) | Vous avez besoin de cache, retries, fallback entre fournisseurs ou observabilité unifiée. |
| **Replicate** (adaptateur TanStack AI ou via AI Gateway) | Modèles de génération d’images non disponibles sur Workers AI. |

## Workers AI

Inférence GPU serverless sur le réseau Cloudflare. Disponible directement depuis Workers avec un binding `ai`.

### Configuration

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

### Sortie structurée

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

### Réponse en streaming

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

![Flux de requete AI Gateway](/diagrams/ai-gateway-request-flow-fr.svg)

Routez les requêtes vers plusieurs fournisseurs via une passerelle unique. Obtenez cache, retries, rate limiting, contrôles de dépense et fallback sans modifier les call sites. En production, préférez AI Gateway BYOK / clés fournisseur stockées afin que Workers et agents IA référencent des clés approuvées sans lire les valeurs en clair.

### Configuration

```bash
pnpm add @tanstack/ai @cloudflare/tanstack-ai
```

Répartition de propriété recommandée :

- Les responsables sécurité/admins créent et font tourner les clés fournisseur stockées.
- Les développeurs référencent les routes gateway ou noms de clés stockées dans le code.
- Les agents peuvent éditer le code de routage/config, mais ne doivent pas recevoir les clés fournisseur brutes.
- Les budgets et limites de débit gateway sont obligatoires pour les boucles d’agents autonomes.

```ts
import { createAnthropicChat, createOpenAiChat } from "@cloudflare/tanstack-ai";

const claude = createAnthropicChat("claude-haiku-4-5", {
  binding: env.AI.gateway("my-gateway"),
  // Prefer a stored provider key / gateway route in production.
  // Use env keys only for dev or providers that still require direct signing.
  apiKey: env.ANTHROPIC_API_KEY,
});

const gpt = createOpenAiChat("gpt-4o-mini", {
  binding: env.AI.gateway("my-gateway"),
  apiKey: env.OPENAI_API_KEY,
});

// Keep fallback selection in application code so behavior is explicit.
const adapters = [claude, gpt];
```

### Options de requête

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

### Fournisseurs pris en charge via AI Gateway

| Fournisseur | Modèles |
|----------|--------|
| OpenAI | GPT-4o, GPT-4o-mini, o1, o3 |
| Anthropic | Claude 3.5, Claude 3 |
| DeepSeek | DeepSeek Chat |
| Google AI | Gemini |
| Grok | modèles xAI |
| Mistral | modèles Mistral |
| Perplexity | Sonar |
| Replicate | Flux, Ideogram, Stable Diffusion |
| Groq | Llama, Mixtral |

## Replicate

Idéal pour les modèles de génération d’images absents de Workers AI. Préférez router Replicate via Cloudflare AI Gateway pour le cache, le fallback et l’observabilité centralisée. Si aucun adaptateur TanStack AI direct n’est disponible pour le workflow image exact, appelez Replicate depuis un service serveur étroit plutôt que d’ajouter un second toolkit IA juste pour les images.

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

### Fallback service direct

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

## Sélection de modèle par tâche

### Génération de texte / raisonnement

| Modèle | Fournisseur | Idéal pour |
|-------|----------|----------|
| `@cf/meta/llama-3.1-8b-instruct` | Workers AI | Rapide, économique, inférence edge |
| `@cf/meta/llama-3.1-70b-instruct` | Workers AI | Qualité supérieure, toujours serverless |
| `kimi-k2.5` | Workers AI | Contexte long (256k), tool calling, vision |
| `gpt-oss-120b` | Workers AI | Open-weight, raisonnement élevé |
| `mistral-small-3.1-24b-instruct` | Workers AI | Vision + contexte long (128k) |
| `qwen3-30b-a3b-fp8` | Workers AI | Raisonnement, function calling, multilingue |
| `deepseek-r1-distill-qwen-32b` | Workers AI | Bons benchmarks de raisonnement |
| `qwq-32b` | Workers AI | Raisonnement chain-of-thought |
| `llama-4-scout-17b-16e-instruct` | Workers AI | MoE multimodal, 16 experts |

### Génération de code

| Modèle | Fournisseur | Idéal pour |
|-------|----------|----------|
| `@cf/qwen/qwen2.5-coder-32b-instruct` | Workers AI | Spécifique code, 32B params |
| `@cf/meta/llama-3.1-8b-instruct` | Workers AI | Assistance code légère |

### Text embeddings

| Modèle | Fournisseur | Idéal pour |
|-------|----------|----------|
| `@cf/baai/bge-base-en-v1.5` | Workers AI | Embeddings anglais généraux |
| `@cf/baai/bge-large-en-v1.5` | Workers AI | Embeddings de meilleure qualité |
| `@cf/google/gemma-3-embedding-300m` | Workers AI | Léger, multilingue |
| `@cf/qwen/qwen3-embedding-0.6b` | Workers AI | Embedding compact |

### Reranking

| Modèle | Fournisseur |
|-------|----------|
| `@cf/baai/bge-reranker-base` | Workers AI |

### Génération d’images

| Modèle | Fournisseur | Idéal pour |
|-------|----------|----------|
| `@cf/black-forest-labs/flux-2-klein-9b` | Workers AI | Distillé rapide, interactif |
| `@cf/black-forest-labs/flux-2-dev` | Workers AI | Haute qualité, multi-référence |
| `@cf/Flux.1/schnell` | Workers AI | Vitesse (1-4 étapes) |
| `black-forest-labs/flux-1.1-pro-ultra` | Replicate | Qualité maximale, coût élevé |
| `black-forest-labs/flux-schnell` | Replicate | Travail local/image rapide |
| `recraft-ai/recraft-v3` | Replicate | Génération SVG |
| `ideogram-ai/ideogram-v2-turbo` | Replicate | Rendu de texte dans les images |
| `luma/photon` | Replicate | Génération photoréaliste |
| `stability-ai/stable-diffusion-3.5-large` | Replicate | Compositions complexes |

### Parole / audio

| Modèle | Fournisseur | Idéal pour |
|-------|----------|----------|
| `@cf/openai/whisper-large-v3-turbo` | Workers AI | Speech-to-text, multilingue |
| `@cf/deepgram/nova-3` | Workers AI | ASR rapide |
| `@cf/deepgram/aura-2-en` | Workers AI | TTS naturel |
| `@cf/myshell-ai/melotts` | Workers AI | TTS multilingue léger |
| `@cf/deepgram/flux` | Workers AI | Parole conversationnelle |

### Vision / multimodal

| Modèle | Fournisseur | Idéal pour |
|-------|----------|----------|
| `@cf/meta/llama-3.2-11b-vision-instruct` | Workers AI | Compréhension d’image |
| `@cf/google/gemma-3-12b-it` | Workers AI | Multimodal, 140+ langues |
| `@cf/llava-hf/llava-1.5-7b-hf` | Workers AI | Image-to-text (beta) |
| `kimi-k2.5` | Workers AI | Contexte long, tool calling, vision |

## Quand utiliser quoi

### Défaut : Workers AI
- Votre cible d’inférence principale.
- Aucune latence de routage externe.
- Serverless, paiement à la requête, pas de gestion GPU.

### Ajouter AI Gateway quand vous avez besoin de :
- BYOK / clés fournisseur stockées que développeurs et agents ne peuvent pas lire.
- Budgets et limites de débit pour les boucles d’agents autonomes.
- Cache pour réduire le coût des prompts répétés.
- Logique de retry avec backoff exponentiel.
- Fallback automatique entre modèles ou fournisseurs.
- Observabilité unifiée sur tous les appels IA.
- Routage multi-fournisseur sans modifier les call sites.

### Utiliser Replicate quand vous avez besoin de :
- Modèles absents de Workers AI (Flux Pro, Ideogram V2, Recraft V3, etc.).
- Capacités spécifiques de génération d’images (inpainting, multi-référence, styles fine-tuned).
- Génération d’images à gros volume où la tarification Replicate convient mieux.

### Utiliser Replicate via AI Gateway quand :
- Vous voulez cache et retries sur les appels de génération d’images.
- Vous avez besoin d’un fallback de Replicate vers Workers AI pour les tâches texte.
- Vous voulez des logs centralisés sur tous les fournisseurs.

## Guides liés

- [Cloudflare Compute](/fr/cloudflare-compute/)
- [Code Patterns](/fr/code-patterns/)
- [MCP Guide](/fr/mcp-guide/)
- [Workers AI Models](https://developers.cloudflare.com/workers-ai/models/)
- [AI Gateway Docs](https://developers.cloudflare.com/ai-gateway/)
- [TanStack AI](https://tanstack.com/ai)
- [TanStack AI Cloudflare adapter](https://tanstack.com/ai/latest/docs/community-adapters/cloudflare)
- [Cloudflare AI package](https://github.com/cloudflare/ai)
