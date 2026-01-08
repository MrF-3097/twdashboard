# FastAPI Backend - Quick Start Guide

## Overview
Backend API dedicat cu FastAPI care servește atât aplicația web Next.js, cât și aplicația React Native, eliminând latența și fricțiunea.

---

## Arhitectură

```
REBS API
    ↓
FastAPI Backend (dedicated API server)
    ↓
    ├─ Next.js Web App (frontend only)
    └─ React Native App
```

**Beneficii:**
- ✅ Latență redusă (3-5x mai rapid decât Next.js API routes)
- ✅ Scalare independentă
- ✅ Single source of truth pentru business logic
- ✅ Auto-generated API docs (Swagger/OpenAPI)

---

## Tech Stack

- **FastAPI** - Modern, fast web framework
- **Python 3.11+** - Runtime
- **SQLAlchemy/Drizzle** - ORM (păstrăm Drizzle dacă e posibil)
- **Redis** - Caching (production)
- **httpx** - Async HTTP client pentru REBS API
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server

---

## Setup

### Prerequisites
- Python 3.11+
- Poetry (sau pip)
- Redis (optional, pentru production)

### Installation
```bash
cd backend-api

# Install dependencies
poetry install
# SAU
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env cu configurațiile tale
```

### Run Development Server
```bash
# With Poetry
poetry run uvicorn app.main:app --reload

# With pip
uvicorn app.main:app --reload
```

### Access API Docs
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## Environment Variables

```bash
# REBS API
REBS_API_BASE_URL=https://towerimob.crmrebs.com/api
REBS_API_TOKEN=your_token_here

# Database
DATABASE_URL=sqlite+aiosqlite:///./data/database.sqlite

# Redis (optional)
REDIS_URL=redis://localhost:6379/0
USE_REDIS=false

# Security
SECRET_KEY=your_secret_key
ALLOWED_ORIGINS=["http://localhost:3000","https://dashboard.towerimob.ro"]
```

---

## API Endpoints

### Base URL
```
http://localhost:8000/api/v1
```

### Main Endpoints
- `POST /auth/login` - Authentication
- `GET /properties` - List properties
- `GET /requests` - List requests
- `GET /leaderboard` - Leaderboard data
- `POST /notifications/subscribe` - Push notifications
- `POST /tools/fix-photo` - Photo fixer
- `POST /tools/generate-ad` - Real estate ad generator

**Vezi documentația completă:** `FASTAPI_MIGRATION_PLAN.md`

---

## Docker

```bash
# Build
docker-compose build

# Run
docker-compose up

# Run in background
docker-compose up -d
```

---

## Testing

```bash
# Run tests
pytest

# With coverage
pytest --cov=app
```

---

## Deployment

### Production Server
```bash
# With Gunicorn + Uvicorn workers
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Docker Production
```bash
docker build -t towerimob-api .
docker run -p 8000:8000 towerimob-api
```

---

## Migration Timeline

- **Week 1**: Setup & Foundation
- **Week 2**: Core Endpoints
- **Week 3**: Tools & Advanced
- **Week 4**: Notifications & Background Tasks
- **Week 5**: Admin & Testing
- **Week 6**: Production Deployment

**Total: ~6 weeks**

---

## Next Steps

1. ✅ Review `FASTAPI_MIGRATION_PLAN.md`
2. ⏳ Setup initial project
3. ⏳ Implementare Phase 1

---

**Document creat:** [CURRENT_DATE]  
**Versiune:** 1.0



















