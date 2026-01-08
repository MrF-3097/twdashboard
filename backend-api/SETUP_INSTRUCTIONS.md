# Setup Instructions - FastAPI Backend

## Pasul 1: Instalează Dependencies

### Opțiunea A: Cu Poetry (Recomandat)
```bash
cd backend-api

# Instalează Poetry (dacă nu e instalat)
curl -sSL https://install.python-poetry.org | python3 -

# Instalează dependencies
poetry install

# Activează virtual environment
poetry shell
```

### Opțiunea B: Cu pip
```bash
cd backend-api

# Creează virtual environment
python3 -m venv venv
source venv/bin/activate  # Pe Windows: venv\Scripts\activate

# Instalează dependencies
pip install -r requirements.txt
```

## Pasul 2: Configurează Environment Variables

```bash
# Copiază template-ul
cp .env.example .env

# Editează .env și completează:
# - REBS_API_TOKEN (OBLIGATORIU - din env.example al proiectului principal)
# - Alte variabile dacă e necesar
```

**IMPORTANT:** `REBS_API_TOKEN` trebuie să fie același ca în proiectul Next.js (din `env.example` sau `.env.local`).

## Pasul 3: Testează Setup-ul

```bash
# Rulează server-ul
poetry run uvicorn app.main:app --reload
# SAU
uvicorn app.main:app --reload

# Deschide în browser:
# - http://localhost:8000/health
# - http://localhost:8000/docs (Swagger UI)
```

## Pasul 4: Verifică REBS Client

Server-ul ar trebui să pornească fără erori. Dacă vezi warning-uri despre `REBS_API_TOKEN`, e normal - va funcționa când completezi `.env`.

## Troubleshooting

### Eroare: "Python 3.11 not found"
- Instalează Python 3.11+ de pe python.org sau folosește pyenv

### Eroare: "Poetry not found"
- Instalează Poetry: `curl -sSL https://install.python-poetry.org | python3 -`
- SAU folosește pip (vezi Opțiunea B)

### Eroare: "Module not found"
- Asigură-te că ai activat virtual environment
- Reinstalează dependencies: `poetry install` sau `pip install -r requirements.txt`

### Port 8000 deja folosit
- Schimbă port-ul în `.env`: `PORT=8001`
- SAU oprește procesul care folosește port-ul 8000

## Next Steps

După ce server-ul pornește cu succes:
1. ✅ Verifică http://localhost:8000/health
2. ✅ Verifică http://localhost:8000/docs
3. ⏳ Următorul pas: Crearea endpoint-urilor de autentificare



















