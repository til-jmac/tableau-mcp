# MCP Server Restart Procedure

## IMPORTANT: Always restart BOTH server AND inspector!

### Full Restart (after code changes):

```bash
# 1. Build
npm run build

# 2. Stop server
lsof -ti:3927 | xargs kill

# 3. Stop inspector (DON'T FORGET THIS!)
lsof -ti:6274 | xargs kill -9
lsof -ti:6277 | xargs kill -9

# 4. Wait
sleep 2

# 5. Start server (background)
TRANSPORT=http DANGEROUSLY_DISABLE_OAUTH=true \
SERVER=https://tableauserver.theinformationlab.co.uk \
SITE_NAME=TableauMCPContent \
PAT_NAME=tableau-mcp-local \
PAT_VALUE='YOUR_PAT_VALUE_HERE' \
node build/index.js &

# 6. Start inspector (background)
npx @modelcontextprotocol/inspector --config config.http.json --server tableau &

# 7. Get NEW URL from inspector output (token changes each time)
# Check: /var/folders/.../tasks/<task-id>.output
```

## Quick check if services are running:
```bash
lsof -i:3927  # Server
lsof -i:6274  # Inspector
```

## Why restart inspector?
The inspector maintains a persistent connection to the server. When the server restarts, the connection breaks and the inspector needs to reconnect with the new server instance.
