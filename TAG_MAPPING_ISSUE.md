# Tag Mapping Issue - REBS API NOU

## Problem Identified

The REBS API NOU schema (`CRM REBS API NOU.yaml`) shows that the `tags` field in `PropertyRequest` expects:

```yaml
tags:
  type: array
  items:
    type: integer  # <-- Tag IDs, not strings!
  title: Tag-uri
```

However, we are currently sending:
- **Tag names as strings** (e.g., `["Aer condiționat", "Piscină", "Garaj"]`)
- **But API expects tag IDs as integers** (e.g., `[1, 5, 12]`)

## Current Implementation

In `mobile-app/src/components/screens/AddPropertyFlow.tsx`:
- We collect selected characteristics as strings (tag names)
- We send them directly to the API as `propertyPayload.tags = allSelectedTags` (array of strings)

## What We Have

From `Documentatie API CRM REBS.txt`, we have:
- Complete list of characteristic **names** in Romanian
- Organized by groups (Dotări, Parcare, etc.)
- But **NO tag IDs** are provided

## What We Need

1. **Tag ID Mapping**: A mapping from characteristic names to their corresponding tag IDs
   - Example: `"Aer condiționat"` → `1`
   - Example: `"Piscină"` → `5`

2. **OR** an API endpoint to fetch available tags with their IDs:
   - Something like `GET /api/property-tags/` that returns `[{id: 1, name: "Aer condiționat"}, ...]`

## Solutions

### Option 1: Get Tag ID Mapping from REBS
Contact REBS support to get the complete mapping of characteristic names to tag IDs.

### Option 2: Test if API Accepts Names
Test if the API actually accepts tag names despite the schema saying integers (some APIs are flexible).

### Option 3: Fetch Tags from API
If there's an endpoint to fetch tags, use it to build the mapping dynamically.

### Option 4: Remove Tags Temporarily
Remove the tags functionality until we have the proper mapping.

## Current Status

- ✅ All characteristic names are valid (from REBS documentation)
- ✅ UI is complete and working
- ❌ Tag format mismatch (sending strings instead of integers)
- ❌ No tag ID mapping available

## Next Steps

1. Test if the API accepts tag names (despite schema)
2. Contact REBS for tag ID mapping
3. Or implement a tag fetching mechanism if available












