---
title: "Les Primitives de Calcul Cloudflare"
verified: 2026-06
---

Cloudflare offre trois primitives de calcul distinctes sur la plateforme Workers. Choisir la bonne dès le début évite des migrations coûteuses.

## Matrice de Décision

| Primitive | Idéal pour | Éviter quand |
|----------|-----------|--------------|
| **Worker** | Logique applicative, APIs, middleware, routage, tâches légères en arrière-plan | Vous avez besoin d'un runtime complet, d'un système de fichiers ou d'un environnement Linux |
| **Dynamic Worker** | Exécuter du code non fiable ou généré par IA dans un bac à sable | Vous avez besoin de calcul CPU intensif, d'un système de fichiers complet ou d'images container existantes |
| **Container** | Charges lourdes, images container existantes, serveurs WebSocket, jobs cron, Region:Earth | Vous avez seulement besoin de gestion simple de requêtes ou d'inférence IA |

## Worker

La primitive par défaut. Déployez du JavaScript ou TypeScript sur le réseau edge de Cloudflare avec des démarrages à froid rapides et sans gestion d'infrastructure.

- Gestion HTTP, routes API, middleware
- Tâches en arrière-plan via Queues ou Workflows
- Services stateful avec Durable Objects
- Bindings R2, D1, KV, Vectorize
- Inférence Workers AI

```ts
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return new Response("Hello from a Worker");
  },
};
```

## Dynamic Worker

Lancez des Workers isolés au runtime pour exécuter du code arbitraire dans un bac à sable sécurisé. Le Worker parent contrôle les bindings reçus par le dynamic Worker et s'il peut accéder au réseau.

### Quand Utiliser

- **Exécution de code d'agent IA**: Laissez un agent écrire et exécuter ses propres outils de manière sécurisée.
- **Code utilisateur non fiable**: Exécutez du code soumis par des utilisateurs dans un bac à sable que vous contrôlez.
- **Previews et playgrounds**: Chargez du code généré en millisecondes.
- **Automatisations personnalisées**: Créez des outils à la volée pour des tâches ponctuelles.
- **"Vibe coding"**: Exécutez des prototypes générés par IA en isolement.

### Fonctionnalités Clés

**Sécurité basée sur les capacités via Workers RPC**
Les bindings utilisent Cap'n Web RPC. Un Dynamic Worker ne reçoit accès qu'à ce que vous lui passez explicitement comme stub. Si vous ne passez jamais un binding, il ne peut pas être atteint.

**Controle de l'egress**
Définissez `globalOutbound: null` pour bloquer tout accès réseau sortant. Le Dynamic Worker ne peut utiliser que les bindings que vous lui donnez. Ou interceptez et réécrivez les requêtes via une passerelle.

**Observabilité via Tail Workers**
Attachez un Tail Worker pour capturer `console.log`, les exceptions et les métadonnées de requête du Dynamic Worker. Les logs sont écrits après le retour de la réponse, donc ils n'ajoutent pas de latence.

### Exemple: Dynamic Worker Minimal

```ts
import { getContainer } from "@cloudflare/containers";

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

### Config Wrangler

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

### Pattern Sécurité: Binding personnalisé pour un Bac à Sable Agent

```ts
import { WorkerEntrypoint } from "cloudflare:workers";

export class ChatRoom extends WorkerEntrypoint<Env, ChatRoomProps> {
  async post(text: string): Promise<void> {
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

L'agent ne voit que la méthode `ChatRoom.post()`. Il ne voit jamais la clé API et ne peut poster dans aucune autre salle.

### Pattern Sécurité: Bloquer l'Accès Reseau Externe

```ts
const worker = env.LOADER.get(id, () => ({
  mainModule: "index.js",
  modules: { "index.js": code },
  globalOutbound: null,
}));
```

Le Dynamic Worker ne peutagir que via les bindings que vous lui passez.

### Pattern Observabilité: Tail Worker

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

const worker = env.LOADER.get(workerId, () => ({
  mainModule: WORKER_MAIN,
  modules: { [WORKER_MAIN]: WORKER_SOURCE },
  tails: [ctx.exports.DynamicWorkerTail({ props: { workerId } })],
}));
```

## Container

Exécutez du code écrit dans n'importe quel langage, compilé pour n'importe quel runtime, dans le cadre d'une application Workers. Les instances de container démarrent à la demande et sont contrôlées par votre code Worker.

**Disponible sur le plan Workers Payant.**

### Quand Utiliser

- **Charges de travail intensives en ressources**: Cores CPU en parallèle, grande quantité de mémoire ou de disque.
- **Accès complet au système de fichiers**: Applications qui nécessitent un vrai environnement de type Linux.
- **Images container existantes**: Outils distribues en tant qu'images Docker.
- **Serveurs WebSocket**: Connexions longue duree qui ne correspondent pas au modèle Workers.
- **Jobs cron**: Exécutez un container sur un planning avec des triggers CRON.
- **Conformité Region:Earth**: Exigences de résidence des données.

### Exemples de Containers Cloudflare

| Pattern | Cas d'usage |
|---------|-------------|
| Frontend statique + Backend container | SPA avec un backend API containerise |
| Cron Container | Charges de travail planifiées via trigger cron |
| Interface Durable Object | Appeler des containers directement depuis des DOs |
| Env vars et secrets | Passer des identifiants de façon sécurisée dans les containers |
| Instances stateless | Passer à l'échelle sur le réseau Cloudflare |
| Status hooks | Réagir aux événements du cycle de vie du container |
| Websocket vers Container | Forwarder les connexions WebSocket vers un container |
| R2 FUSE mount | Monter des buckets R2 comme systèmes de fichiers dans un container |

### Config Wrangler

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

### Classe Container Basique

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

## Choisir Entre Dynamic Worker et Container

| Dimension | Dynamic Worker | Container |
|-----------|----------------|-----------|
| Vitesse de démarrage | Sub-milliseconde | Secondes à minutes |
| Runtime | Isolats V8 (JavaScript/TypeScript) | Container Linux complet |
| Modèle de sécurité | RPC base sur les capacités, pas de réseau par défaut | Isolation réseau configurable |
| Génération de code | Oui - l'agent écrit du code au runtime | Non - l'image doit exister au préalable |
| CPU/mémoire | Léger | Accès CPU et mémoire complet |
| Systeme de fichiers | Non | Accès complet |
| Idéal pour | Bac à sable agent IA, code non fiable, previews rapides | Images préconstruites, charges lourdes, WebSockets |

**Règle empirique**: utilisez Dynamic Workers quand le Worker écrit ou génère le code. Utilisez Containers quand vous devez expédier et exécuter une image préconstruite.

## Principes de Sécurité

1. **Bloquer le réseau par défaut**: Définissez `globalOutbound: null` et n'accordez l'accès que via des bindings étroits.
2. **Utiliser des bindings basés sur les capacités**: Passez des stubs avec seulement les méthodes dont le Worker à besoin, pas des identifiants bruts.
3. **Injecter les identifiants à la passerelle**: N'exposez jamais les secrets au Dynamic Worker; réécrivez ou injectez à la limite.
4. **Utiliser les Tail Workers pour l'observabilité**: Capturez les logs sans ajouter de latence à la requête.

## Guides Liés

- [Fournisseurs IA](/fr/ai-providers/)
- [Guide de Déploiement](/fr/deployment/)
- [Patterns de Code](/fr/code-patterns/)
- [Workers AI](https://developers.cloudflare.com/workers-ai/)
- [Dynamic Workers](https://developers.cloudflare.com/dynamic-workers/)
- [Containers](https://developers.cloudflare.com/containers/)
