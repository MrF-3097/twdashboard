# Agent Dashboard API Documentation

## Overview

This API allows external systems (like a separate leaderboard display on a Smart TV) to access leaderboard data. When admin changes are made in the main dashboard, they are immediately reflected in the API, ensuring both the webapp and external displays stay synchronized.

## Synchronization

- **Cache Duration**: 5 seconds (reduced from 30s for faster updates)
- **Update Frequency**: Changes made in admin dashboard appear in API within 5 seconds
- **Polling Recommendation**: External systems should poll every 5-10 seconds for near real-time updates
- **ETag Support**: Use ETag header for efficient cache validation

## Leaderboard API

### Endpoint
```
GET /api/leaderboard
```

### Description
Returns the complete leaderboard data including agent rankings, commission data, gamification metrics (XP, levels), and enriched agent information from REBS CRM.

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `since` | string (ISO date) | No | - | Filter transactions since this date (e.g., `2025-01-01T00:00:00Z`) |
| `agent` | string | No | - | Filter by specific agent name |
| `limit` | number | No | All | Limit number of results returned |
| `include_stats` | boolean | No | `true` | Include statistics in response |

### Response Format

```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "id": 1234,
        "name": "Maria Popescu",
        "rank": 1,
        "email": "maria.popescu@rebs.ro",
        "phone": "+40 722 123 456",
        "avatar": "https://...",
        "profile_picture": "https://...",
        "closed_transactions": 28,
        "total_value": 3500000,
        "total_commission": 12500,
        "xp": 12500,
        "level": 13,
        "active_listings": 12,
        "position": "Senior Agent",
        "first_name": "Maria",
        "last_name": "Popescu"
      }
    ],
    "stats": {
      "total_agents": 8,
      "total_transactions": 150,
      "total_sales_value": 20000000,
      "total_commission": 85000,
      "top_performer": { /* agent object */ },
      "updated_at": "2025-11-12T15:30:00.000Z"
    }
  },
  "meta": {
    "count": 8,
    "updated_at": "2025-11-12T15:30:00.000Z"
  }
}
```

### Agent Object Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | number/string | Unique identifier (hash of agent name) |
| `name` | string | Full name of the agent |
| `rank` | number | Current rank in leaderboard (1 = top) |
| `email` | string? | Email address from REBS CRM |
| `phone` | string? | Phone number from REBS CRM |
| `avatar` | string? | Avatar URL from REBS CRM |
| `profile_picture` | string? | Profile picture URL from REBS CRM |
| `closed_transactions` | number | Number of closed transactions |
| `total_value` | number | Total value of all transactions (EUR) |
| `total_commission` | number | Total commission earned (EUR) |
| `xp` | number | Experience points (1 XP per euro of commission) |
| `level` | number | Agent level (level up every 1000 XP) |
| `active_listings` | number? | Number of active property listings |
| `position` | string? | Job position from REBS CRM |
| `first_name` | string? | First name from REBS CRM |
| `last_name` | string? | Last name from REBS CRM |

### Stats Object Fields

| Field | Type | Description |
|-------|------|-------------|
| `total_agents` | number | Total number of agents in leaderboard |
| `total_transactions` | number | Sum of all closed transactions |
| `total_sales_value` | number | Sum of all transaction values (EUR) |
| `total_commission` | number | Sum of all commissions (EUR) |
| `top_performer` | object? | Agent object for rank #1 |
| `updated_at` | string | ISO timestamp of last update |

### Example Requests

#### Get all agents
```bash
curl https://your-domain.com/api/leaderboard
```

#### Get top 10 agents
```bash
curl https://your-domain.com/api/leaderboard?limit=10
```

#### Get agents since a specific date
```bash
curl https://your-domain.com/api/leaderboard?since=2025-01-01T00:00:00Z
```

#### Get specific agent
```bash
curl https://your-domain.com/api/leaderboard?agent=Maria%20Popescu
```

#### Get without statistics
```bash
curl https://your-domain.com/api/leaderboard?include_stats=false
```

### CORS Support

The API includes CORS headers, allowing cross-origin requests from any domain. This enables you to consume the API from different ports or projects.

### Caching

Responses are cached for 30 seconds (`s-maxage=30`) with stale-while-revalidate for 60 seconds to improve performance while keeping data relatively fresh.

### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "data": {
    "agents": [],
    "stats": {
      "total_agents": 0,
      "total_transactions": 0,
      "total_sales_value": 0,
      "total_commission": 0,
      "top_performer": null,
      "updated_at": "2025-11-12T15:30:00.000Z"
    }
  },
  "meta": {
    "count": 0,
    "updated_at": "2025-11-12T15:30:00.000Z"
  }
}
```

### Usage Examples

#### JavaScript/TypeScript
```typescript
async function fetchLeaderboard(limit?: number) {
  const url = limit 
    ? `https://your-domain.com/api/leaderboard?limit=${limit}`
    : 'https://your-domain.com/api/leaderboard'
  
  const response = await fetch(url)
  const data = await response.json()
  
  if (data.success) {
    console.log(`Top ${data.data.agents.length} agents:`)
    data.data.agents.forEach(agent => {
      console.log(`${agent.rank}. ${agent.name} - ${agent.total_commission}€`)
    })
    
    console.log(`Total: ${data.data.stats.total_commission}€`)
  }
}
```

#### Python
```python
import requests

def fetch_leaderboard(limit=None):
    url = 'https://your-domain.com/api/leaderboard'
    params = {'limit': limit} if limit else {}
    
    response = requests.get(url, params=params)
    data = response.json()
    
    if data['success']:
        for agent in data['data']['agents']:
            print(f"{agent['rank']}. {agent['name']} - {agent['total_commission']}€")
        
        print(f"Total: {data['data']['stats']['total_commission']}€")
```

#### React Component
```tsx
import { useEffect, useState } from 'react'

interface LeaderboardData {
  agents: Array<{
    rank: number
    name: string
    total_commission: number
    xp: number
    level: number
  }>
  stats: {
    total_agents: number
    total_commission: number
  }
}

export function LeaderboardWidget() {
  const [data, setData] = useState<LeaderboardData | null>(null)
  
  useEffect(() => {
    fetch('https://your-domain.com/api/leaderboard?limit=10')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setData(result.data)
        }
      })
  }, [])
  
  if (!data) return <div>Loading...</div>
  
  return (
    <div>
      <h2>Top Agents</h2>
      {data.agents.map(agent => (
        <div key={agent.rank}>
          {agent.rank}. {agent.name} - Level {agent.level} ({agent.xp} XP)
        </div>
      ))}
    </div>
  )
}
```

### Notes

- The API aggregates data from the local transactions database
- Agent enrichment (avatars, contact info) comes from REBS CRM API
- XP is calculated as 1 XP per euro of commission
- Levels are calculated as `floor(XP / 1000) + 1`
- Rankings are based on total commission (descending order)
- The API is read-only and does not modify any data
- **Admin changes are immediately reflected**: When transactions are added via admin dashboard, they appear in the API within 5 seconds

## Integration Guide for Separate Leaderboard Project

### Recommended Setup

For a separate leaderboard project (e.g., Smart TV display), follow these best practices:

#### 1. Polling Strategy

```typescript
// Poll every 5-10 seconds for near real-time updates
const POLL_INTERVAL = 5000 // 5 seconds

async function fetchLeaderboard() {
  try {
    const response = await fetch('http://your-dashboard-server:3000/api/leaderboard')
    const data = await response.json()
    
    if (data.success) {
      updateDisplay(data.data.agents, data.data.stats)
    }
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error)
  }
}

// Start polling
setInterval(fetchLeaderboard, POLL_INTERVAL)
fetchLeaderboard() // Initial fetch
```

#### 2. Using ETag for Efficient Updates

```typescript
let lastETag = null

async function fetchLeaderboardWithETag() {
  const headers: HeadersInit = {}
  if (lastETag) {
    headers['If-None-Match'] = lastETag
  }
  
  const response = await fetch('http://your-dashboard-server:3000/api/leaderboard', { headers })
  
  if (response.status === 304) {
    // Not modified - no update needed
    return
  }
  
  const etag = response.headers.get('ETag')
  if (etag) {
    lastETag = etag
  }
  
  const data = await response.json()
  if (data.success) {
    updateDisplay(data.data.agents, data.data.stats)
  }
}
```

#### 3. React Hook Example

```tsx
import { useEffect, useState } from 'react'

const API_URL = 'http://your-dashboard-server:3000/api/leaderboard'
const POLL_INTERVAL = 5000

export function useLeaderboard() {
  const [agents, setAgents] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let intervalId: NodeJS.Timeout

    const fetchData = async () => {
      try {
        const response = await fetch(API_URL)
        const data = await response.json()
        
        if (data.success) {
          setAgents(data.data.agents)
          setStats(data.data.stats)
          setError(null)
        } else {
          setError(data.error || 'Failed to fetch leaderboard')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Network error')
      } finally {
        setLoading(false)
      }
    }

    // Initial fetch
    fetchData()

    // Set up polling
    intervalId = setInterval(fetchData, POLL_INTERVAL)

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [])

  return { agents, stats, loading, error }
}
```

#### 4. Error Handling & Retry Logic

```typescript
async function fetchWithRetry(url: string, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url)
      if (response.ok) {
        return await response.json()
      }
      throw new Error(`HTTP ${response.status}`)
    } catch (error) {
      if (i === retries - 1) throw error
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000))
    }
  }
}
```

### Admin Changes → API Updates Flow

1. **Admin adds transaction** via `/admin` dashboard
2. **Transaction saved** to database via `/api/admin/add-transaction`
3. **API reads fresh data** from database (no cache on database queries)
4. **External leaderboard** polls API every 5-10 seconds
5. **Changes visible** within 5 seconds maximum

### Response Headers

The API includes helpful headers:

- `Cache-Control`: `public, s-maxage=5, stale-while-revalidate=10`
- `ETag`: `"2025-11-12T15:30:00.000Z"` (timestamp-based)
- `X-Leaderboard-Updated`: Included in transaction POST responses

### Testing Synchronization

To verify your separate leaderboard stays in sync:

1. Open admin dashboard: `http://your-server:3000/admin`
2. Add a test transaction
3. Check API response: `curl http://your-server:3000/api/leaderboard`
4. Verify your separate leaderboard updates within 5-10 seconds

