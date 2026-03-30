# Les Primitives de Calcul Cloudflare

Cloudflare offre trois primitives de calcul distinctes sur la plateforme Workers. Choisir la bonne des le debut evite des migrations couteuses.

## Matrice de Decision

| Primitve | Ideal pour | Eviter quand |
|----------|-----------|--------------|
| **Worker** | Logique applicative, APIs, middleware, routage, taches legeres en arriere-plan | Vous avez besoin d'un runtime complet, d'un systeme de fichiers ou d'un environnement Linux |
| **Dynamic Worker** | Executer du code non fiable ou genere par IA dans un bac a sable | Vous avez besoin de calcul CPU intensif, d'un systeme de fichiers complet ou d'images container existantes |
| **Container** | Charges lourdes, images container existantes, serveurs WebSocket, jobs cron, Region:Earth | Vous avez seulement besoin de gestion simple de requetes ou d'inference IA |

## Worker

La primitive par defaut. Deploiez du JavaScript ou TypeScript sur le reseau edge de Cloudflare avec des demarrages a froid rapides et sans gestion d'infrastructure.

- Gestion HTTP, routes API, middleware
- Taches en arriere-plan via Queues ou Workflows
- Services stateful avec Durable Objects
- Bindings R2, D1, KV, Vectorize
- Inference Workers AI

```ts
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return new Response("Hello from a Worker");
  },
};
```

## Dynamic Worker

Lancez des Workers isoles au runtime pour executer du code arbitraire dans un bac a sable securise. Le Worker parent controle les bindings reçus par le dynamic Worker et s'il peut acceder au reseau.

### Quand Utiliser

- **Execution de code d'agent IA**: Laissez un agent ecrire et executer ses propres outils de maniere securisee.
- **Code utilisateur non fiable**: Executez du code soumis par des utilisateurs dans un bac a sable que vous controlez.
- **Previews et playgrounds**: Chargez du code genere en millisecondes.
- **Automatisations personnalisees**: Creez des outils a la volee pour des taches ponctuelles.
- **"Vibe coding"**: Executez des prototypes generes par IA en isolement.

### Fonctionnalites Cles

**Securite basee sur les capacites via Workers RPC**
Les bindings utilisent Cap'n Web RPC. Un Dynamic Worker ne recoit acces qu'a ce que vous lui passez explicitement comme stub. Si vous ne passez jamais un binding, il ne peut pas etre atteint.

**Controle de l'egress**
Definissez `globalOutbound: null` pour bloquer tout acces reseau sortant. Le Dynamic Worker ne peut utiliser que les bindings que vous lui donnez. Ou interceptez et reecrivez les requetes via une passerelle.

**Observabilite via Tail Workers**
Attachez un Tail Worker pour capturer `console.log`, les exceptions et les metadonnees de requete du Dynamic Worker. Les logs sont ecrits apres le retour de la reponse, donc ils n'ajoutent pas de latence.

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

### Pattern Securite: Binding Personnalise pour un Bac a Sable Agent

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

L'agent ne voit que la methode `ChatRoom.post()`. Il ne voit jamais la cle API et ne peut poster dans aucune autre salle.

### Pattern Securite: Bloquer l'Acces Reseau Externe

```ts
const worker = env.LOADER.get(id, () => ({
  mainModule: "index.js",
  modules: { "index.js": code },
  globalOutbound: null,
}));
```

Le Dynamic Worker ne peutagir que via les bindings que vous lui passez.

### Pattern Observabilite: Tail Worker

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

Executez du code ecrit dans n'importe quel langage, compile pour n'importe quel runtime, dans le cadre d'une application Workers. Les instances de container demarrent a la demande et sont controlees par votre code Worker.

**Disponible sur le plan Workers Payant.**

### Quand Utiliser

- **Charges de travail intensives en ressources**: Cores CPU en parallele, grande quantite de memoire ou de disque.
- **Acces complet au systeme de fichiers**: Applications qui necessitent un vrai environnement de type Linux.
- **Images container existantes**: Outils distribues en tant qu'images Docker.
- **Serveurs WebSocket**: Connexions longue duree qui ne correspondent pas au modele Workers.
- **Jobs cron**: Executez un container sur un planning avec des triggers CRON.
- **Conformite Region:Earth**: Exigences de residence des donnees.

### Exemples de Containers Cloudflare

| Pattern | Cas d'usage |
|---------|-------------|
| Frontend statique + Backend container | SPA avec un backend API containerise |
| Cron Container | Charges de travail planifiees via trigger cron |
| Interface Durable Object | Appeler des containers directement depuis des DOs |
| Env vars et secrets | Passer des identifiants securitairement dans les containers |
| Instances stateless | Passer a l'echelle sur le reseau Cloudflare |
| Status hooks | Reacter aux evenements du cycle de vie du container |
| Websocket vers Container | Forwarder les connexions WebSocket vers un container |
| R2 FUSE mount | Monter des buckets R2 comme systemes de fichiers dans un container |

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
| Vitesse de demarrage | Sub-milliseconde | Secondes a minutes |
| Runtime | Isolats V8 (JavaScript/TypeScript) | Container Linux complet |
| Modele de securite | RPC base sur les capacites, pas de reseau par defaut | Isolation reseau configurable |
| Generation de code | Oui - l'agent ecrit du code au runtime | Non - l'image doit exister au prealable |
| CPU/memoire | Leger | Acces CPU et memoire complet |
| Systeme de fichiers | Non | Acces complet |
| Ideal pour | Bac a sable agent IA, code non fiable, previews rapides | Images preconstruites, charges lourdes, WebSockets |

**Regle empirique**: utilisez Dynamic Workers quand le Worker ecrit ou genere le code. Utilisez Containers quand vous devez expedier et executer une image preconstruite.

## Principes de Securite

1. **Bloquer le reseau par defaut**: Definissez `globalOutbound: null` et n'accordez l'acces que via des bindings etroits.
2. **Utiliser des bindings bases sur les capacites**: Passez des stubs avec seulement les methodes dont le Worker a besoin, pas des identifiants bruts.
3. **Injecter les identifiants a la passerelle**: N'exposez jamais les secrets au Dynamic Worker; reecrivez ou injectez a la limite.
4. **Utiliser les Tail Workers pour l'observabilite**: Capturez les logs sans ajouter de latence a la requete.

## Guides Lies

- [AI Providers](./AI-PROVIDERS.md)
- [Guide de Deploiement](./DEPLOYMENT.md)
- [Patterns de Code](./CODE-PATTERNS.md)
- [Workers AI](https://developers.cloudflare.com/workers-ai/)
- [Dynamic Workers](https://developers.cloudflare.com/dynamic-workers/)
- [Containers](https://developers.cloudflare.com/containers/)
