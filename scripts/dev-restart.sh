#!/bin/bash
# Rebuild and restart the MCP server for development testing

set -e

echo "Building..."
npm run build

echo "Stopping existing server..."
pkill -f "node build/index.js" 2>/dev/null || true

echo "Starting server..."
export $(cat env.list | xargs)
node build/index.js
