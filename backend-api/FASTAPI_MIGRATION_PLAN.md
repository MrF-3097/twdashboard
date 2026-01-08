# FastAPI Backend Migration Plan

## Francesco [DATE]: Plan pentru migrarea API-urilor către FastAPI

### Overview
Acest document descrie planul pentru crearea unui backend API dedicat cu FastAPI care va servi atât aplicația web Next.js, cât și aplicația React Native, eliminând latența și fricțiunea dintre aplicații.

---

## 1. ARHITECTURĂ PROPUȘĂ

### 1.1 Arhitectura Actuală (Problematică)
```
REBS API
    ↓
Next.js API Routes (src/app/api/)
    ↓
    ├─ Next.js Web App (frontend)
    └─ React Native App (ar apela Next.js API routes)
```

**Probleme:**
- ❌ Latență suplimentară (Next.js server overhead)
- ❌ Bottleneck când ambele aplicații folosesc același endpoint
- ❌ Dependență de Next.js server pentru mobile
- ❌ Scalare limitată
- ❌ Duplicare de logică între web și mobile

### 1.2 Arhitectura Nouă (Optimizată)
```
REBS API
    ↓
FastAPI Backend (dedicated API server)
    ↓
    ├─ Next.js Web App (frontend only, calls FastAPI)
    └─ React Native App (calls FastAPI directly)
```

**Beneficii:**
- ✅ Latență redusă (API dedicat, optimizat)
- ✅ Scalare independentă (backend separat)
- ✅ Single source of truth pentru business logic
- ✅ Reutilizare de cod între web și mobile
- ✅ Performance mai bună (FastAPI este foarte rapid)
- ✅ Type safety cu Pydantic
- ✅ Auto-generated API documentation (Swagger/OpenAPI)
- ✅ Async/await nativ (Python async)
- ✅ Background tasks (Celery sau FastAPI BackgroundTasks)

---

## 2. STRUCTURA PROIECTULUI FASTAPI

### 2.1 Folder Structure
```
backend-api/
├── .env.example
├── .gitignore
├── pyproject.toml              # Poetry pentru dependency management
├── poetry.lock
├── README.md
├── Dockerfile
├── docker-compose.yml
├── requirements.txt            # Fallback dacă nu folosim Poetry
│
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app entry point
│   ├── config.py               # Configuration (env vars, settings)
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py             # Dependencies (auth, db, etc.)
│   │   │
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── router.py       # Main router (include all sub-routers)
│   │   │   │
│   │   │   ├── auth/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── routes.py   # Login, status, logout
│   │   │   │   └── schemas.py  # Pydantic models
│   │   │   │
│   │   │   ├── properties/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── routes.py   # List, detail, images
│   │   │   │   └── schemas.py
│   │   │   │
│   │   │   ├── requests/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── routes.py   # List, detail, add
│   │   │   │   └── schemas.py
│   │   │   │
│   │   │   ├── transactions/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── routes.py   # List, detail, add
│   │   │   │   └── schemas.py
│   │   │   │
│   │   │   ├── leaderboard/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── routes.py   # List, check-changes
│   │   │   │   └── schemas.py
│   │   │   │
│   │   │   ├── agents/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── routes.py   # List, detail, properties, targets
│   │   │   │   └── schemas.py
│   │   │   │
│   │   │   ├── tools/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── document_converter.py
│   │   │   │   ├── photo_fixer.py
│   │   │   │   ├── real_estate_generator.py
│   │   │   │   └── image_editor.py
│   │   │   │
│   │   │   ├── notifications/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── routes.py   # Subscribe, unsubscribe, send
│   │   │   │   └── schemas.py
│   │   │   │
│   │   │   ├── news/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── routes.py   # Items, likes, check-new-agents
│   │   │   │   └── schemas.py
│   │   │   │
│   │   │   └── admin/
│   │   │       ├── __init__.py
│   │   │       ├── routes.py   # Add agent, add transaction, etc.
│   │   │       └── schemas.py
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── security.py         # JWT, password hashing, etc.
│   │   ├── config.py           # App configuration
│   │   └── exceptions.py       # Custom exceptions
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── rebs_client.py      # REBS API client (similar cu rebs-client.ts)
│   │   ├── cache_service.py     # Redis/Memory cache
│   │   ├── database.py         # SQLite/Drizzle ORM setup
│   │   ├── push_notifications.py # Web push service
│   │   ├── leaderboard_monitor.py # Leaderboard monitoring
│   │   └── rate_limiter.py     # Rate limiting (similar cu rate-limit.ts)
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── agent.py            # Agent model (SQLAlchemy/Drizzle)
│   │   ├── transaction.py
│   │   ├── property.py
│   │   ├── request.py
│   │   └── ...                 # Alte modele
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── common.py           # Common Pydantic schemas
│   │   ├── agent.py
│   │   ├── property.py
│   │   └── ...                 # Alte schemas
│   │
│   └── utils/
│       ├── __init__.py
│       ├── logger.py           # Logging utility
│       ├── validators.py       # Custom validators
│       └── formatters.py       # Date, price formatters
│
├── tests/
│   ├── __init__.py
│   ├── conftest.py             # Pytest fixtures
│   ├── test_auth.py
│   ├── test_properties.py
│   └── ...
│
└── scripts/
    ├── migrate_db.py            # Database migrations
    └── seed_data.py            # Seed initial data
```

---

## 3. TECH STACK FASTAPI

### 3.1 Core Dependencies
```toml
[tool.poetry.dependencies]
python = "^3.11"
fastapi = "^0.109.0"
uvicorn = {extras = ["standard"], version = "^0.27.0"}
pydantic = "^2.5.0"
pydantic-settings = "^2.1.0"

# Database
sqlalchemy = "^2.0.25"
drizzle-orm = "^0.29.0"          # Dacă vrem să păstrăm Drizzle
drizzle-kit = "^0.20.0"
aiosqlite = "^0.19.0"            # Async SQLite
# SAU
# asyncpg = "^0.29.0"            # Pentru PostgreSQL (dacă migrăm)

# HTTP Client
httpx = "^0.26.0"                # Pentru REBS API calls (async)
aiohttp = "^3.9.0"               # Alternative

# Caching
redis = {extras = ["hiredis"], version = "^5.0.0"}  # Pentru production
# SAU memory cache pentru development

# Authentication & Security
python-jose = {extras = ["cryptography"], version = "^3.3.0"}
passlib = {extras = ["bcrypt"], version = "^1.7.4"}
python-multipart = "^0.0.6"      # Pentru file uploads

# Background Tasks
celery = "^5.3.4"                # Pentru background jobs
# SAU
# fastapi-background-tasks      # Built-in (simpler, dar limitat)

# Image Processing
pillow = "^10.2.0"               # Image manipulation
sharp-py = "^0.1.0"              # SAU folosim Pillow

# Document Processing
python-docx = "^1.1.0"           # DOCX handling
PyPDF2 = "^3.0.1"                # PDF handling
# SAU pypdf (mai modern)

# AI/ML (pentru real-estate generator)
openai = "^1.10.0"               # OpenAI API

# Web Push
pywebpush = "^1.14.0"            # Web push notifications

# Utilities
python-dateutil = "^2.8.2"
pytz = "^2024.1"
```

### 3.2 Dev Dependencies
```toml
[tool.poetry.group.dev.dependencies]
pytest = "^7.4.4"
pytest-asyncio = "^0.23.3"
httpx = "^0.26.0"                # Pentru test client
black = "^24.1.0"                # Code formatter
ruff = "^0.1.11"                 # Linter
mypy = "^1.8.0"                  # Type checker
```

---

## 4. MAPPING ENDPOINT-URI EXISTENTE → FASTAPI

### 4.1 Authentication Endpoints
```python
# Current: src/app/api/auth/login/route.ts
# New: app/api/v1/auth/routes.py

@router.post("/auth/login")
async def login(credentials: LoginRequest):
    """
    Authenticate agent with REBS API
    Returns agent data with session token
    """
    # Logic din route.ts
    pass

@router.get("/auth/status")
async def check_auth_status(agent_id: int, current_user: Agent = Depends(get_current_agent)):
    """
    Check if agent session is still valid
    """
    pass
```

### 4.2 Properties Endpoints
```python
# Current: src/app/api/properties/route.ts
# New: app/api/v1/properties/routes.py

@router.get("/properties")
async def list_properties(
    page: int = 1,
    page_size: int = 100,
    ordering: str = "-date_added",
    property_type: Optional[int] = None,
    transaction_type: Optional[int] = None,
    price_min: Optional[float] = None,
    price_max: Optional[float] = None,
    cache: bool = True
):
    """
    List all properties with pagination and filters
    Uses parallel fetching and caching (similar logic)
    """
    pass

@router.get("/properties/{property_id}")
async def get_property_detail(property_id: int):
    """
    Get single property details
    """
    pass

@router.get("/properties/{property_id}/images")
async def get_property_images(property_id: int):
    """
    Get property images from REBS
    """
    pass
```

### 4.3 Requests Endpoints
```python
# Current: src/app/api/requests/route.ts
# New: app/api/v1/requests/routes.py

@router.get("/requests")
async def list_requests(
    ordering: str = "-date_added",
    agent: Optional[int] = None,
    property_type: Optional[int] = None,
    transaction_type: Optional[int] = None,
    price_filter_gte: Optional[float] = None,
    price_filter_lte: Optional[float] = None,
    rooms_filter_gte: Optional[int] = None,
    rooms_filter_lte: Optional[int] = None
):
    """
    List all requests with filters
    Uses parallel pagination (similar logic)
    """
    pass

@router.post("/requests")
async def create_request(request_data: CreateRequestSchema, current_user: Agent = Depends(get_current_agent)):
    """
    Create new request in REBS
    """
    pass
```

### 4.4 Leaderboard Endpoints
```python
# Current: src/app/api/leaderboard/route.ts
# New: app/api/v1/leaderboard/routes.py

@router.get("/leaderboard")
async def get_leaderboard(
    period: str = "month",  # "month" | "ytd" | "all"
    limit: int = 100
):
    """
    Get leaderboard with agent rankings
    """
    pass

@router.post("/leaderboard/check-changes")
async def check_leaderboard_changes(
    current_leaderboard: LeaderboardSnapshot,
    background_tasks: BackgroundTasks
):
    """
    Check for leaderboard changes and send notifications
    """
    pass
```

### 4.5 Tools Endpoints
```python
# Current: src/app/api/fix-photo/route.ts
# New: app/api/v1/tools/photo_fixer.py

@router.post("/tools/fix-photo")
async def fix_photo(
    file: UploadFile,
    expansion_percent: int = 20
):
    """
    Auto-detect rotation and fix photo
    Returns processed image
    """
    pass

# Current: src/app/api/real-estate/generate/route.ts
# New: app/api/v1/tools/real_estate_generator.py

@router.post("/tools/generate-ad")
async def generate_real_estate_ad(
    request: GenerateAdRequest,
    current_user: Agent = Depends(get_current_agent)
):
    """
    Generate real estate ad using OpenAI
    """
    pass
```

### 4.6 Notifications Endpoints
```python
# Current: src/app/api/notifications/subscribe/route.ts
# New: app/api/v1/notifications/routes.py

@router.post("/notifications/subscribe")
async def subscribe_to_notifications(
    subscription: PushSubscriptionSchema,
    current_user: Agent = Depends(get_current_agent)
):
    """
    Subscribe agent to push notifications
    """
    pass

@router.delete("/notifications/subscribe")
async def unsubscribe_from_notifications(
    current_user: Agent = Depends(get_current_agent)
):
    """
    Unsubscribe agent from push notifications
    """
    pass
```

---

## 5. IMPLEMENTARE DETALIATĂ

### 5.1 Main Application Setup
```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from app.api.v1.router import api_router
from app.core.config import settings

app = FastAPI(
    title="Tower Imob Dashboard API",
    description="Backend API for Tower Imob Agent Dashboard",
    version="1.0.0",
    docs_url="/docs",  # Swagger UI
    redoc_url="/redoc"  # ReDoc
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}
```

### 5.2 REBS Client Service
```python
# app/services/rebs_client.py
import httpx
from app.core.config import settings
from app.utils.logger import logger

class REBSClient:
    def __init__(self):
        self.base_url = settings.REBS_API_BASE_URL
        self.api_token = settings.REBS_API_TOKEN
        self.timeout = 30.0
    
    async def fetch(self, path: str, method: str = "GET", **kwargs):
        """
        Async REBS API client (similar cu rebsFetch din TypeScript)
        """
        url = f"{self.base_url}/{path.lstrip('/')}"
        headers = {
            "Authorization": f"Token {self.api_token}",
            "Accept": "application/json"
        }
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.request(
                    method=method,
                    url=url,
                    headers={**headers, **kwargs.get("headers", {})},
                    **{k: v for k, v in kwargs.items() if k != "headers"}
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                logger.error(f"REBS API error: {e}")
                raise

rebs_client = REBSClient()
```

### 5.3 Cache Service
```python
# app/services/cache_service.py
from typing import Optional, Any
from datetime import datetime, timedelta
import redis.asyncio as redis
from app.core.config import settings

class CacheService:
    def __init__(self):
        # Use Redis in production, memory cache in dev
        if settings.USE_REDIS:
            self.redis_client = redis.from_url(settings.REDIS_URL)
        else:
            self.memory_cache = {}
    
    async def get(self, key: str) -> Optional[Any]:
        if settings.USE_REDIS:
            data = await self.redis_client.get(key)
            return json.loads(data) if data else None
        else:
            entry = self.memory_cache.get(key)
            if entry and datetime.now() < entry["expires"]:
                return entry["data"]
            return None
    
    async def set(self, key: str, value: Any, ttl: int = 60):
        expires = datetime.now() + timedelta(seconds=ttl)
        if settings.USE_REDIS:
            await self.redis_client.setex(
                key, ttl, json.dumps(value)
            )
        else:
            self.memory_cache[key] = {
                "data": value,
                "expires": expires
            }

cache_service = CacheService()
```

### 5.4 Rate Limiting
```python
# app/services/rate_limiter.py
from fastapi import Request, HTTPException
from app.services.cache_service import cache_service
import time

class RateLimiter:
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
    
    async def check_rate_limit(self, key: str):
        """
        Check if request is within rate limit
        Similar logic cu rate-limit.ts
        """
        cache_key = f"rate_limit:{key}"
        requests = await cache_service.get(cache_key) or []
        
        # Remove expired entries
        now = time.time()
        requests = [r for r in requests if r > now - self.window_seconds]
        
        if len(requests) >= self.max_requests:
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded"
            )
        
        requests.append(now)
        await cache_service.set(cache_key, requests, self.window_seconds)

# Rate limiters per endpoint
login_rate_limiter = RateLimiter(max_requests=5, window_seconds=60)
api_rate_limiter = RateLimiter(max_requests=30, window_seconds=60)
```

---

## 6. MIGRARE INCREMENTALĂ

### Phase 1: Setup & Foundation (Week 1)
- [ ] Setup FastAPI project structure
- [ ] Configure Poetry/pip dependencies
- [ ] Setup database connection (SQLite cu Drizzle)
- [ ] Create REBS client service
- [ ] Implement authentication endpoints
- [ ] Setup CORS și middleware
- [ ] Deploy pe server de test

### Phase 2: Core Endpoints (Week 2)
- [ ] Migrate properties endpoints
- [ ] Migrate requests endpoints
- [ ] Migrate leaderboard endpoints
- [ ] Implement caching
- [ ] Add rate limiting
- [ ] Update Next.js să apeleze FastAPI

### Phase 3: Tools & Advanced (Week 3)
- [ ] Migrate document converter
- [ ] Migrate photo fixer
- [ ] Migrate real estate generator
- [ ] Migrate image editor
- [ ] File upload handling

### Phase 4: Notifications & Background Tasks (Week 4)
- [ ] Migrate push notifications service
- [ ] Migrate leaderboard monitoring
- [ ] Setup background tasks (Celery sau FastAPI BackgroundTasks)
- [ ] Webhook endpoints

### Phase 5: Admin & Testing (Week 5)
- [ ] Migrate admin endpoints
- [ ] Add comprehensive tests
- [ ] Performance optimization
- [ ] Documentation (Swagger auto-generated)
- [ ] Update React Native app să folosească FastAPI

### Phase 6: Production Deployment (Week 6)
- [ ] Setup production server (Gunicorn/Uvicorn)
- [ ] Configure Redis pentru cache
- [ ] Setup monitoring (Sentry, logging)
- [ ] Load testing
- [ ] Gradual rollout (10% → 50% → 100%)
- [ ] Deprecate Next.js API routes

---

## 7. CONFIGURARE ȘI DEPLOYMENT

### 7.1 Environment Variables
```bash
# .env
# REBS API
REBS_API_BASE_URL=https://towerimob.crmrebs.com/api
REBS_API_TOKEN=your_token_here

# Database
DATABASE_URL=sqlite+aiosqlite:///./data/database.sqlite
# SAU pentru PostgreSQL:
# DATABASE_URL=postgresql+asyncpg://user:pass@localhost/dbname

# Redis (optional, pentru production)
REDIS_URL=redis://localhost:6379/0
USE_REDIS=false  # true pentru production

# Security
SECRET_KEY=your_secret_key_here
ALLOWED_ORIGINS=["http://localhost:3000","https://dashboard.towerimob.ro"]

# OpenAI (pentru real-estate generator)
OPENAI_API_KEY=your_openai_key

# VAPID (pentru push notifications)
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:your-email@example.com

# Server
HOST=0.0.0.0
PORT=8000
```

### 7.2 Docker Setup
```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install Poetry
RUN pip install poetry

# Copy dependency files
COPY pyproject.toml poetry.lock ./

# Install dependencies
RUN poetry config virtualenvs.create false && \
    poetry install --no-dev

# Copy application
COPY . .

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 7.3 Docker Compose (pentru development)
```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - REBS_API_TOKEN=${REBS_API_TOKEN}
      - DATABASE_URL=sqlite+aiosqlite:///./data/database.sqlite
    volumes:
      - ./data:/app/data
    command: uvicorn app.main:app --reload --host 0.0.0.0

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

---

## 8. BENEFICII ȘI METRICI

### 8.1 Performance Improvements
- **Latență redusă**: FastAPI este ~3-5x mai rapid decât Next.js API routes
- **Throughput mai mare**: Async nativ în Python
- **Scalare**: Backend separat poate fi scalat independent
- **Caching centralizat**: Redis pentru cache shared între web și mobile

### 8.2 Developer Experience
- **Auto-generated docs**: Swagger UI la `/docs`
- **Type safety**: Pydantic pentru validation
- **Testing**: Pytest cu async support
- **Debugging**: Better error messages și stack traces

### 8.3 Maintainability
- **Single source of truth**: Business logic într-un singur loc
- **Reusability**: Același API pentru web și mobile
- **Separation of concerns**: Frontend vs Backend clar separate

---

## 9. NEXT STEPS

1. ✅ **Review acest plan** și aprobare
2. ⏳ **Setup initial FastAPI project** (Phase 1)
3. ⏳ **Migrare incrementală** (Phase 2-5)
4. ⏳ **Testing și optimization** (Phase 6)
5. ⏳ **Production deployment**

---

**Document creat de:** Auto (AI Assistant)  
**Data:** [CURRENT_DATE]  
**Versiune:** 1.0  
**Status:** Draft - Așteaptă review și aprobare



















