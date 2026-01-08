"""
Main API router for v1
Includes all sub-routers
"""
from fastapi import APIRouter
from app.api.v1.auth.routes import router as auth_router
from app.api.v1.properties.routes import router as properties_router
from app.api.v1.requests.routes import router as requests_router

api_router = APIRouter(prefix="/api/v1")

# Include sub-routers
api_router.include_router(auth_router)
api_router.include_router(properties_router)
api_router.include_router(requests_router)

# TODO: Add more routers as we implement them
# api_router.include_router(leaderboard_router)

