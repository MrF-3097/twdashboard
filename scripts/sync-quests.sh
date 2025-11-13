#!/bin/bash

# Quest System Sync Script
# This script can be run periodically (e.g., via cron) to sync quest progress
# Usage: ./scripts/sync-quests.sh [BASE_URL]
# Example cron: 0 * * * * /path/to/project/scripts/sync-quests.sh https://your-domain.com

BASE_URL="${1:-http://localhost:3000}"
ENDPOINT="${BASE_URL}/api/quests/sync"

echo "🔄 Syncing quest system at $(date)"
echo "📍 Endpoint: ${ENDPOINT}"

RESPONSE=$(curl -s -X POST "${ENDPOINT}" \
  -H "Content-Type: application/json" \
  -w "\nHTTP_STATUS:%{http_code}")

HTTP_STATUS=$(echo "${RESPONSE}" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "${RESPONSE}" | sed '/HTTP_STATUS/d')

if [ "${HTTP_STATUS}" -eq 200 ]; then
  echo "✅ Sync completed successfully"
  echo "${BODY}" | python3 -m json.tool 2>/dev/null || echo "${BODY}"
else
  echo "❌ Sync failed with HTTP status: ${HTTP_STATUS}"
  echo "${BODY}"
  exit 1
fi









