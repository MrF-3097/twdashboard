# Tower Imob Dashboard - FastAPI Backend

## 📡 Overview

Backend API dedicat cu FastAPI care servește atât aplicația web Next.js, cât și aplicația React Native, eliminând latența și fricțiunea dintre aplicații.

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Poetry (recomandat) sau pip

### Installation

#### With Poetry (Recomandat)
```bash
cd backend-api

# Install Poetry (dacă nu e instalat)
curl -sSL https://install.python-poetry.org | python3 -

# Install dependencies
poetry install

# Activate virtual environment
poetry shell

# Setup environment
cp .env.example .env
# Edit .env cu configurațiile tale (REBS_API_TOKEN, etc.)
```

#### With pip
```bash
cd backend-api

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env cu configurațiile tale
```

### Run Development Server

```bash
# With Poetry
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# With pip
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Access API

- **API Base**: http://localhost:8000
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## 📋 Environment Variables

Creează fișierul `.env` din `.env.example` și completează:

```bash
# REBS API (OBLIGATORIU)
REBS_API_TOKEN=your_rebs_api_token_here

# Alte variabile (vezi .env.example pentru detalii)
```

## 🏗 Project Structure

```
backend-api/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry point
│   ├── core/
│   │   ├── config.py        # Configuration
│   │   └── security.py      # Auth, JWT (TODO)
│   ├── services/
│   │   └── rebs_client.py   # REBS API client
│   ├── api/                 # API routes (TODO)
│   └── models/              # Database models (TODO)
├── pyproject.toml            # Poetry dependencies
├── requirements.txt         # pip dependencies
└── .env.example             # Environment template
```

## 📚 Documentation

- **[FASTAPI_MIGRATION_PLAN.md](./FASTAPI_MIGRATION_PLAN.md)** - Plan complet pentru migrarea API-urilor
- **[QUICK_START.md](./QUICK_START.md)** - Ghid rapid

## 🛠 Development

### Run Tests
```bash
pytest
```

### Code Formatting
```bash
# With Poetry
poetry run black app/
poetry run ruff check app/

# With pip
black app/
ruff check app/
```

## 📝 Status

**Current Phase:** Setup & Foundation (Phase 1)  
**Next Steps:**
- [ ] Create API routers (auth, properties, requests, etc.)
- [ ] Setup database connection
- [ ] Implement authentication endpoints
- [ ] Add caching service

---

**Last Updated:** [CURRENT_DATE]
