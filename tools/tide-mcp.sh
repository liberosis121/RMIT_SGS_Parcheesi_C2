#!/usr/bin/env bash
# Call a Tide MCP (Raziel) tool over plain HTTP and print its text output.
# Usage: tools/tide-mcp.sh <tool> '<json-args>'
#   tools/tide-mcp.sh tide_list '{"category":"playbooks"}'
#   tools/tide-mcp.sh tide_playbook '{"name":"setup-iga-admin-panel"}'
#   tools/tide-mcp.sh tide_canon '{"name":"iga-change-requests-api","section":"Bootstrap"}'
set -euo pipefail
tool="$1"; args="${2:-{\}}"
curl -s -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' \
  -X POST https://mcp.tide.org/mcp \
  -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"$tool\",\"arguments\":$args}}" \
| sed -n 's/^data: //p' \
| python -I -c "import sys,json;d=json.load(sys.stdin);r=d.get('result',d);print('\n'.join(c.get('text','') for c in r.get('content',[])) if isinstance(r,dict) and 'content' in r else r)"
