"""
Dashboard Agents Store Service
Reads and manages dashboard agents from JSON file
Similar to dashboard-agents-store.ts from Next.js
"""
import json
import hashlib
from pathlib import Path
from typing import Optional, List
from pydantic import BaseModel, EmailStr
import logging

logger = logging.getLogger(__name__)


class DashboardAgentRaw(BaseModel):
    """Raw agent data with password hash"""
    id: int
    name: str
    email: EmailStr
    phone: Optional[str] = None
    role: str  # 'agent' | 'admin'
    passwordHash: str
    isActive: bool
    createdAt: str
    updatedAt: str


class DashboardAgent(BaseModel):
    """Agent data without password hash"""
    id: int
    name: str
    email: EmailStr
    phone: Optional[str] = None
    role: str
    isActive: bool
    createdAt: str
    updatedAt: str


def hash_password(plain_text_password: str) -> str:
    """
    Hash password using SHA256 (same as Next.js implementation)
    """
    return hashlib.sha256(plain_text_password.encode()).hexdigest()


class DashboardAgentsStore:
    """Service for managing dashboard agents"""
    
    def __init__(self, store_path: Optional[Path] = None):
        if store_path is None:
            # Default path: data/dashboard-agents.json (relative to project root)
            project_root = Path(__file__).parent.parent.parent
            store_path = project_root / "data" / "dashboard-agents.json"
        
        self.store_path = store_path
        self._ensure_store_file()
    
    def _ensure_store_file(self):
        """Ensure store file exists"""
        self.store_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.store_path.exists():
            self.store_path.write_text("[]", encoding="utf-8")
            logger.info(f"Created dashboard agents store: {self.store_path}")
    
    def _read_agents_raw(self) -> List[DashboardAgentRaw]:
        """Read agents from JSON file"""
        try:
            content = self.store_path.read_text(encoding="utf-8")
            data = json.loads(content or "[]")
            return [DashboardAgentRaw(**agent) for agent in data]
        except Exception as e:
            logger.error(f"Error reading agents store: {e}")
            return []
    
    def _write_agents_raw(self, agents: List[DashboardAgentRaw]):
        """Write agents to JSON file"""
        data = [agent.model_dump() for agent in agents]
        self.store_path.write_text(
            json.dumps(data, indent=2, ensure_ascii=False),
            encoding="utf-8"
        )
    
    def get_agent_by_email(self, email: str) -> Optional[DashboardAgentRaw]:
        """Get agent by email"""
        agents = self._read_agents_raw()
        email_lower = email.lower()
        for agent in agents:
            if agent.email.lower() == email_lower:
                return agent
        return None
    
    def get_agent_by_id(self, agent_id: int) -> Optional[DashboardAgentRaw]:
        """Get agent by ID"""
        agents = self._read_agents_raw()
        for agent in agents:
            if agent.id == agent_id:
                return agent
        return None
    
    def list_agents(self) -> List[DashboardAgent]:
        """List all agents (without password hashes)"""
        agents_raw = self._read_agents_raw()
        return [
            DashboardAgent(
                id=agent.id,
                name=agent.name,
                email=agent.email,
                phone=agent.phone,
                role=agent.role,
                isActive=agent.isActive,
                createdAt=agent.createdAt,
                updatedAt=agent.updatedAt,
            )
            for agent in agents_raw
        ]


# Global instance
dashboard_agents_store = DashboardAgentsStore()



















