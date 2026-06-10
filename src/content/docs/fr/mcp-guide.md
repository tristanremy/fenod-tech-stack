---
title: "MCP with Claude Code"
verified: 2026-06
---

[Disponible en anglais](/fr/mcp-guide/)

## Le problème

Avec des centaines de serveurs MCP et des milliers d’outils :
- la fenêtre de contexte se remplit de définitions d’outils que vous n’utilisez jamais
- les résultats intermédiaires gaspillent des tokens
- aucune vérification de confiance pour les serveurs

## Solution : Docker MCP Gateway

L’approche MCP dynamique de Docker résout les trois points :
1. **Confiance** - Serveurs vérifiés dans le catalogue Docker
2. **Contexte** - Charge uniquement les outils réellement nécessaires
3. **Découverte** - Les agents trouvent et configurent les outils autonomement

### Configuration

```bash
# Update Docker Desktop (enable MCP toolkit in beta features)
# Connect servers via Docker Desktop → MCP Catalog
```

Claude Code se connecte à Docker, Docker gère tous les serveurs MCP.

### Fonctionnement

Au lieu de charger tous les outils dès le départ, Docker fournit :
- `mcp_find` - Rechercher dans le catalogue par nom/description
- `mcp_add` - Connecter un serveur
- `mcp_remove` - Déconnecter un serveur

L’agent découvre et charge uniquement ce dont il a besoin par session.

### Code Mode

Les agents écrivent des outils JavaScript qui chaînent des appels MCP. Utilisez-le par défaut quand un agent doit orchestrer une grande surface d’API comme Cloudflare, GitHub, Linear, Stripe ou des APIs d’administration internes.

```
Without code mode:
- Many endpoint/tool definitions live in context
- Each call returns full results to context
- Context fills quickly and agent cost rises with API size

With code mode:
- Agent gets a small search/execute surface
- Agent writes custom tool using only needed API calls
- Results saved to volume, not context
- Only summaries/answers returned to model
```

C’est particulièrement important pour l’automatisation Cloudflare. N’exposez pas chaque opération Cloudflare comme des outils indépendants toujours chargés quand l’agent doit seulement déployer un Worker ou inspecter une base D1. Gardez les grands catalogues d’API derrière search/execute, des scripts broker ou Code Mode.

Exemple : rechercher GitHub → sauvegarder dans Notion
```
1. Agent creates "github-to-notion" tool
2. Tool searches repos with multiple keywords
3. Results written to Notion database
4. Model only sees "29 repos saved"
```

Avantages :
- Exécution sandboxée (sécurisée)
- Persistance d’état (volumes)
- Usage minimal du contexte

## Chrome DevTools MCP

Inspection directe du navigateur depuis Claude Code.

### Configuration

```json
// claude_desktop_config.json or .mcp.json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["@anthropic-ai/chrome-devtools-mcp@latest"]
    }
  }
}
```

### Lancer Chrome

```bash
# Mac
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222

# Windows
chrome.exe --remote-debugging-port=9222

# Linux
google-chrome --remote-debugging-port=9222
```

### Capacités

| Outil | Usage |
|------|-----|
| `chrome_navigate` | Aller à une URL |
| `chrome_screenshot` | Capturer la page |
| `chrome_click` | Cliquer un élément |
| `chrome_type` | Saisir du texte |
| `chrome_evaluate` | Exécuter du JS |
| `chrome_logs` | Obtenir les logs console |
| `chrome_network` | Voir les requêtes |

Claude peut :
- déboguer les erreurs console
- inspecter les requêtes réseau
- vérifier localStorage/cookies
- tester les interactions UI
- vérifier l’état du DOM

## Serveurs MCP Cloudflare

L’accès MCP Cloudflare doit suivre la même frontière que les tokens de déploiement : limité aux ressources quand possible, lecture seule sauf si une mutation est explicitement nécessaire, et routé via un broker ou la CI pour les changements de production.

### Serveurs disponibles

| Serveur | Usage |
|--------|-----|
| `mcp-server-cloudflare` | Gérer Workers, KV, R2, D1 |
| `@cloudflare/tanstack-ai` | Adaptateurs TanStack AI pour Workers AI et AI Gateway |

### Configuration

```json
{
  "mcpServers": {
    "cloudflare": {
      "command": "npx",
      "args": ["@cloudflare/mcp-server-cloudflare"],
      "env": {
        "CLOUDFLARE_API_TOKEN": "your-token",
        "CLOUDFLARE_ACCOUNT_ID": "your-account-id"
      }
    }
  }
}
```

### Capacités

**Workers :**
- Lister/créer/supprimer des Workers
- Déployer du code
- Voir les logs

**KV :**
- Créer des namespaces
- Get/put/delete des clés
- Lister les clés

**R2 :**
- Créer des buckets
- Uploader/downloader des objets
- Lister les objets

**D1 :**
- Créer des bases de données
- Exécuter des requêtes
- Lister les tables

## Setup recommandé

Pour les projets Fenod Stack :

```json
{
  "mcpServers": {
    "docker": {
      "command": "docker",
      "args": ["mcp", "gateway"]
    },
    "chrome-devtools": {
      "command": "npx",
      "args": ["@anthropic-ai/chrome-devtools-mcp@latest"]
    },
    "cloudflare": {
      "command": "npx",
      "args": ["@cloudflare/mcp-server-cloudflare"],
      "env": {
        "CLOUDFLARE_API_TOKEN": "${CLOUDFLARE_API_TOKEN}",
        "CLOUDFLARE_ACCOUNT_ID": "${CLOUDFLARE_ACCOUNT_ID}"
      }
    }
  }
}
```

## Conseils

- Utiliser Docker gateway pour le chargement dynamique des outils (économise des tokens)
- Préférer Code Mode/search/execute pour les grandes APIs plutôt que charger chaque endpoint comme outil
- Chrome MCP pour le débogage frontend
- Cloudflare MCP pour la gestion d’infrastructure, uniquement avec des tokens limités aux ressources
- Chaîner les outils avec code mode pour les workflows complexes
- Résultats vers fichiers/bases de données, pas vers le contexte
- Ajouter des budgets/limites de débit avant de laisser les agents exécuter des workflows Cloudflare ou AI Gateway autonomes
