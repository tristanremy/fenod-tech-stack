---
title: "MCP with Claude Code"
verified: 2026-06
---

[Disponible en français](/mcp-guide/)

## The Problem

With hundreds of MCP servers and thousands of tools:
- Context window fills with tool definitions you never use
- Token waste on intermediate results
- No trust verification for servers

## Solution: Docker MCP Gateway

Docker's dynamic MCP approach solves all three:
1. **Trust** - Verified servers in Docker catalog
2. **Context** - Only loads tools you actually need
3. **Discovery** - Agents find and configure tools autonomously

### Setup

```bash
# Update Docker Desktop (enable MCP toolkit in beta features)
# Connect servers via Docker Desktop → MCP Catalog
```

Claude Code connects to Docker, Docker manages all MCP servers.

### How It Works

Instead of loading all tools upfront, Docker provides:
- `mcp_find` - Search catalog by name/description
- `mcp_add` - Connect a server
- `mcp_remove` - Disconnect a server

The agent discovers and loads only what it needs per session.

### Code Mode

Agents write JavaScript tools that chain MCP calls. Use this by default when an agent needs to orchestrate a large API surface such as Cloudflare, GitHub, Linear, Stripe, or internal admin APIs.

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

This is especially important for Cloudflare automation. Do not expose every Cloudflare operation as independent always-loaded tools when the agent only needs to deploy one Worker or inspect one D1 database. Keep broad API catalogs behind search/execute, broker scripts, or Code Mode.

Example: Search GitHub → Save to Notion
```
1. Agent creates "github-to-notion" tool
2. Tool searches repos with multiple keywords
3. Results written to Notion database
4. Model only sees "29 repos saved"
```

Benefits:
- Sandboxed execution (secure)
- State persistence (volumes)
- Minimal context usage

## Chrome DevTools MCP

Direct browser inspection from Claude Code.

### Setup

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

### Launch Chrome

```bash
# Mac
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222

# Windows
chrome.exe --remote-debugging-port=9222

# Linux
google-chrome --remote-debugging-port=9222
```

### Capabilities

| Tool | Use |
|------|-----|
| `chrome_navigate` | Go to URL |
| `chrome_screenshot` | Capture page |
| `chrome_click` | Click element |
| `chrome_type` | Type text |
| `chrome_evaluate` | Run JS |
| `chrome_logs` | Get console logs |
| `chrome_network` | View requests |

Claude can:
- Debug console errors
- Inspect network requests
- Check localStorage/cookies
- Test UI interactions
- Verify DOM state

## Cloudflare MCP Servers

Cloudflare MCP access should follow the same boundary as deploy tokens: resource-scoped where possible, read-only unless mutation is explicitly needed, and routed through a broker or CI for production changes.

### Available Servers

| Server | Use |
|--------|-----|
| `mcp-server-cloudflare` | Manage Workers, KV, R2, D1 |
| `@cloudflare/tanstack-ai` | TanStack AI adapters for Workers AI and AI Gateway |

### Setup

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

### Capabilities

**Workers:**
- List/create/delete Workers
- Deploy code
- View logs

**KV:**
- Create namespaces
- Get/put/delete keys
- List keys

**R2:**
- Create buckets
- Upload/download objects
- List objects

**D1:**
- Create databases
- Run queries
- List tables

## Recommended Setup

For Fenod Stack projects:

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

## Tips

- Use Docker gateway for dynamic tool loading (saves tokens)
- Prefer Code Mode/search/execute for large APIs instead of loading every endpoint as a tool
- Chrome MCP for frontend debugging
- Cloudflare MCP for infrastructure management, with resource-scoped tokens only
- Chain tools with code mode for complex workflows
- Results to files/databases, not context
- Add budget/rate limits before letting agents run autonomous Cloudflare or AI Gateway workflows
