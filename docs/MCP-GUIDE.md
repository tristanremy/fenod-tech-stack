# MCP with Claude Code

[:gb: English](./MCP-GUIDE.md) | [:fr: Français](./fr/MCP-GUIDE.md)

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

Agents write JavaScript tools that chain MCP calls:

```
Without code mode:
- 50 tool definitions in context
- Each call returns full results to context
- Context fills after ~20 calls

With code mode:
- Agent writes custom tool using only needed MCP tools
- Results saved to volume, not context
- Only summaries/answers returned to model
```

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

### Available Servers

| Server | Use |
|--------|-----|
| `mcp-server-cloudflare` | Manage Workers, KV, R2, D1 |
| `workers-ai-provider` | AI models on Workers |

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
- Chrome MCP for frontend debugging
- Cloudflare MCP for infrastructure management
- Chain tools with code mode for complex workflows
- Results to files/databases, not context
