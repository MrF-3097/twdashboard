"""
Pydantic schemas for authentication endpoints
"""
from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    """Login request schema"""
    email: EmailStr
    password: str


class AgentResponse(BaseModel):
    """Agent data response (without password)"""
    id: int
    name: str
    email: EmailStr
    phone: str | None = None
    created_at: str | None = None
    updatedAt: str
    propertiesCount: int = 0
    avatar: str | None = None
    position: str | None = None


class LoginResponse(BaseModel):
    """Login response schema"""
    success: bool
    agent: AgentResponse


class AuthStatusResponse(BaseModel):
    """Auth status response schema"""
    success: bool
    data: AgentResponse | None = None
    isActive: bool = True



















