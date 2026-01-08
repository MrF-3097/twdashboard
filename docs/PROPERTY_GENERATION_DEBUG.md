# Property Title and Description Generation - Debugging Guide

**Date:** 2025-01-27  
**Author:** Francesco  
**Issue:** AI didn't generate title and description when POST request was sent for a property

## Overview

The property POST endpoint (`/api/rebs/add-property`) uses OpenAI API to automatically generate:
1. **Property Title** - Generated from property type, transaction mode, rooms, and price
2. **Property Description** - Generated using GPT-4o-mini with custom ruleset and instructions

Both are generated **BEFORE** the payload is sent to REBS API.

## Changes Made

### 1. Enhanced Logging (`src/app/api/rebs/add-property/route.ts`)

Added comprehensive logging throughout the property creation flow:

- **OpenAI Initialization Logging**: Logs whether OpenAI client is properly initialized
- **Title Generation Logging**: Logs all inputs and the generated title
- **Description Generation Logging**: 
  - Logs when OpenAI API is called
  - Logs API response details (usage, duration, choices count)
  - Logs success/failure with detailed error information
  - Logs when fallback description is used
- **Payload Preparation Logging**: Logs final title and description before sending to REBS

### 2. Test Endpoint (`src/app/api/rebs/test-property-generation/route.ts`)

Created a dedicated test endpoint that:
- Tests title generation logic
- Tests description generation with OpenAI
- Returns detailed test results without creating an actual property
- Can be called independently to verify OpenAI integration

### 3. Test Script (`scripts/test-property-generation.js`)

Created a Node.js script that:
- Sends a test payload to the test endpoint
- Displays formatted test results
- Shows OpenAI status, title generation, and description generation
- Can be run with: `npm run test:property-generation`

## How to Debug

### Step 1: Check Server Logs

When a property POST request is made, check the server console/logs for:

```
[Property API] OpenAI client initialized successfully
[Property API] Generating title and description for property
[Property API] Property title generated
[Property API] Starting description generation
[Property API] Calling OpenAI API for description generation
[Property API] OpenAI API call completed
[Property API] Successfully generated AI description
[Property API] Property payload prepared
```

### Step 2: Run Test Script

Run the test script to verify OpenAI integration:

```bash
npm run test:property-generation
```

This will:
- Test title generation
- Test description generation
- Show if OpenAI API key is set
- Display generated title and description
- Show any errors

### Step 3: Check Environment Variables

Verify that `OPENAI_API_KEY` is set:

```bash
# In your .env.local or environment
OPENAI_API_KEY=your_key_here
```

The logs will show:
- `✅ OpenAI client initialized successfully` if key is set
- `⚠️ OpenAI client NOT initialized` if key is missing

### Step 4: Common Issues and Solutions

#### Issue: Title is empty or missing

**Possible Causes:**
- Property type is missing
- Transaction mode is invalid
- Price parsing failed

**Debug:**
- Check logs for `[Property API] Property title generated` - it shows the generated title
- Verify property data includes: `propertyType`, `transactionMode`, `pricing.salePrice` or `pricing.rentPrice`

#### Issue: Description is missing or using fallback

**Possible Causes:**
1. **OpenAI API Key not set**
   - Check logs for: `[Property API] OpenAI client NOT initialized`
   - Solution: Set `OPENAI_API_KEY` in environment

2. **OpenAI API call failed**
   - Check logs for: `[Property API] OpenAI API call failed`
   - Solution: Check error details in logs, verify API key is valid, check network connectivity

3. **OpenAI returned empty response**
   - Check logs for: `[Property API] OpenAI returned empty description`
   - Solution: This is rare, but check OpenAI API status

4. **Exception during generation**
   - Check logs for: `[Property API] OpenAI error details`
   - Solution: Review error message and stack trace

#### Issue: Description is generated but not included in payload

**Debug:**
- Check logs for: `[Property API] Property payload prepared`
- Verify `hasDescription: true` and `descriptionLength > 0`
- Check if description is being overwritten somewhere

## Code Flow

```
POST /api/rebs/add-property
  ↓
Parse and validate payload
  ↓
buildPropertyTitle(parsed)
  → Returns: "Apartament de vânzare 3 camere | 120.000 €"
  ↓
generateDescription(parsed)
  → Builds summary from property data
  → Calls OpenAI API (if available)
  → Returns AI-generated description or fallback
  ↓
Combine description + media notes
  ↓
mapPropertyPayload(parsed, contactIds, finalDescription, propertyTitle)
  → Includes title and description in payload
  ↓
POST to REBS API /properties/
```

## Testing

### Manual Test via API

```bash
curl -X POST http://localhost:3000/api/rebs/test-property-generation \
  -H "Content-Type: application/json" \
  -d '{
    "property": {
      "propertyType": "Apartament",
      "transactionMode": "sale",
      "location": {
        "city": "București",
        "street": "Strada Exemplu"
      },
      "characteristics": {
        "rooms": "3",
        "bathrooms": "2"
      },
      "pricing": {
        "salePrice": "120000",
        "currency": "EUR"
      }
    }
  }'
```

### Test via Script

```bash
npm run test:property-generation
```

## Logging Levels

- **INFO**: Normal flow, successful operations
- **WARN**: Non-critical issues (e.g., OpenAI not available, using fallback)
- **ERROR**: Failures that need attention
- **DEBUG**: Detailed information (only in development mode)

## Next Steps

1. Monitor logs when creating properties
2. Run test script to verify OpenAI integration
3. Check that `OPENAI_API_KEY` is properly set
4. Review error logs if generation fails
5. Verify generated title and description in REBS after property creation

## Related Files

- `src/app/api/rebs/add-property/route.ts` - Main property creation endpoint
- `src/app/api/rebs/test-property-generation/route.ts` - Test endpoint
- `scripts/test-property-generation.js` - Test script
- `src/lib/logger.ts` - Logging utility






