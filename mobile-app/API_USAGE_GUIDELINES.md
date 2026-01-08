# REBS API Usage Guidelines

**Last Updated:** December 16, 2024

## Critical Information from CRM Team

The CRM team has explicitly warned that both the web app and mobile app were **spamming API calls**, causing:
- Unnecessary load on CRM infrastructure
- Interference with CRM team's work and testing
- Risk of throttling, instability, or access limitations

This document outlines the proper API usage to prevent these issues.

---

## API Split: OLD vs NEW

### OLD API (Use for GET Operations)

**Base URL:** `https://towerimob.crmrebs.com/api/public`

**Token:** `303ea2a1928b789d9f4b011aecfe12199098b2fd`

**Use for:**
- ✅ Portfolio/property listings: `/api/public/property/`
- ✅ Agent data (name, phone, image): `/api/public/agent/`
- ✅ Property images (included directly as `full_images`, `resized_images`)
- ✅ All general GET/read operations

**Authentication:**
- Query param: `?api_key=303ea2a1928b789d9f4b011aecfe12199098b2fd`
- Header: `Authorization: 303ea2a1928b789d9f4b011aecfe12199098b2fd` (NO "Token " prefix!)

**Pagination:**
- Uses `meta` field: `{ limit, next, offset, previous, total_count }`
- Uses `offset` and `limit` params
- Follow `meta.next` until null

**Ordering:**
- Use `order_by` parameter (e.g., `order_by=-date_added`)

**Response Structure:**
```json
{
  "meta": {
    "limit": 20,
    "next": "/api/public/property/?offset=20&limit=20",
    "offset": 0,
    "previous": null,
    "total_count": 500
  },
  "objects": [
    {
      "id": 1234,
      "title": "Apartament 2 camere",
      "full_images": ["https://..."],
      "resized_images": ["https://..."],
      ...
    }
  ]
}
```

### NEW API (Use ONLY for POST Operations)

**Base URL:** `https://towerimob.crmrebs.com/api`

**Token:** `22a329334f5a2cfae340a427eff3d7d07847d5a7`

**Use ONLY for:**
- ✅ POST add property: `/api/public/addproperty/`
- ✅ POST add request: `/api/public/addrequest/`
- ✅ GET cereri (requests retrieval)

**DO NOT use for:**
- ❌ Portfolio listings
- ❌ Agent listings
- ❌ Property images (use OLD API response)
- ❌ Property cards data

---

## Key Implementation Details

### 1. Images Are Included in Property Response

**OLD behavior (WRONG):**
```typescript
// ❌ DON'T DO THIS - causes API spam
const properties = await fetch('/api/properties/');
for (const prop of properties) {
  const images = await fetch(`/api/properties/${prop.id}/images/`);
}
```

**NEW behavior (CORRECT):**
```typescript
// ✅ DO THIS - images already included
const response = await fetch('/api/public/property/');
const properties = response.objects;
// Each property already has:
// - full_images: string[]
// - resized_images: string[]
// - thumbnail: string
```

### 2. Cache Strategy

- **TTL:** 6 hours
- **Storage:** AsyncStorage
- **Behavior:** If cache is fresh, skip all API calls
- **On Expo restart:** Use cached data, don't refetch

### 3. Polling Intervals (Reduced)

All hooks have been updated to reduce API spam:

| Hook | Foreground | Background | Previous FG | Previous BG |
|------|------------|------------|-------------|-------------|
| `useProperties` | 5 min | 15 min | 30s | 2 min |
| `useRequests` | 5 min | 15 min | 30s | 2 min |
| `useTransactions` | 5 min | 15 min | 15s | 60s |
| `useLeaderboard` | 5 min | 15 min | 15s | 60s |

**Background polling is now disabled** - hooks only poll when app is in foreground.

---

## File Reference

| File | Purpose |
|------|---------|
| `rebs-old-client.ts` | OLD API client for GET operations |
| `rebs-client.ts` | NEW API client for POST operations only |
| `useProperties.ts` | Properties hook using OLD API |
| `useRequests.ts` | Requests hook (reduced polling) |
| `useTransactions.ts` | Transactions hook (reduced polling) |
| `useLeaderboard.ts` | Leaderboard hook (reduced polling) |
| `propertiesCache.ts` | AsyncStorage cache for properties |

## Force Refresh

To bypass the 6-hour cache (e.g., after adding a property), call:

```typescript
import { invalidatePropertiesCache } from '@/hooks/useProperties';

// Before refetching
invalidatePropertiesCache();
queryClient.invalidateQueries({ queryKey: ['rebsProperties'] });
```

---

## Summary

1. **GET operations** → Use OLD API (`/api/public/...`)
2. **POST operations** → Use NEW API
3. **Images** → Already in property response, NO separate fetch
4. **Polling** → 5min foreground, 15min background
5. **Cache** → 6-hour TTL, skip API if fresh

Following these guidelines will significantly reduce API calls and maintain good standing with the CRM team.

