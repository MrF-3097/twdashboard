# Testing Guide - FastAPI Backend

## Quick Start

### 1. Install Dependencies
```bash
cd backend-api
poetry install
# SAU
pip install -r requirements.txt
```

### 2. Setup Environment
```bash
cp .env.example .env
# Edit .env și adaugă REBS_API_TOKEN
```

### 3. Start Server
```bash
poetry run uvicorn app.main:app --reload
# SAU
uvicorn app.main:app --reload
```

### 4. Access API
- **Base URL**: http://localhost:8000
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## Testing Endpoints

### Health Check
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "0.1.0"
}
```

### Authentication - Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "agent@example.com",
    "password": "your_password"
  }'
```

Expected response:
```json
{
  "success": true,
  "agent": {
    "id": 1,
    "name": "Agent Name",
    "email": "agent@example.com",
    "phone": "+40123456789",
    "created_at": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "propertiesCount": 5,
    "avatar": "https://...",
    "position": "Senior Agent"
  }
}
```

### Authentication - Status
```bash
curl "http://localhost:8000/api/v1/auth/status?agent_id=1"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Agent Name",
    "email": "agent@example.com",
    ...
  },
  "isActive": true
}
```

### Properties - List
```bash
curl http://localhost:8000/api/v1/properties
```

Expected response:
```json
{
  "success": true,
  "data": {
    "objects": [...],
    "meta": {
      "total_count": 100,
      "limit": 100,
      "offset": 0
    }
  },
  "_performance": {
    "duration_ms": 1234,
    "cached": false
  }
}
```

### Requests - List
```bash
curl "http://localhost:8000/api/v1/requests?ordering=-date_added"
```

With filters:
```bash
curl "http://localhost:8000/api/v1/requests?transaction_type=2&property_type=1&price_filter_lte=150000"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "objects": [...],
    "meta": {
      "total_count": 50,
      "page": 1,
      "page_size": 50,
      "has_next": false,
      "has_previous": false
    }
  },
  "_performance": {
    "duration_ms": 567,
    "cached": false
  }
}
```

## Common Issues

### Error: "REBS_API_TOKEN is required"
**Solution**: Add `REBS_API_TOKEN` to `.env` file

### Error: "Module not found"
**Solution**: 
```bash
poetry install
# SAU
pip install -r requirements.txt
```

### Error: "Port 8000 already in use"
**Solution**: Change port in `.env`:
```
PORT=8001
```

### Error: "Could not fetch user data from REBS API"
**Solution**: Check REBS_API_TOKEN and REBS_API_BASE_URL in `.env`

## Performance Testing

### Check Cache
First request (cache miss):
```bash
time curl http://localhost:8000/api/v1/properties
```

Second request (cache hit - should be faster):
```bash
time curl http://localhost:8000/api/v1/properties
```

### Check Parallel Pagination
Monitor logs to see parallel fetching:
```bash
poetry run uvicorn app.main:app --reload --log-level debug
```

## Next Steps

After testing these endpoints:
1. ✅ Verify all endpoints work
2. ⏳ Setup React Native app
3. ⏳ Connect React Native to FastAPI backend
4. ⏳ Test end-to-end flow

---

**Last Updated:** [CURRENT_DATE]



















