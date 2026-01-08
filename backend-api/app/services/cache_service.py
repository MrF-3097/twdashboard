"""
Cache Service
In-memory cache for API responses (similar to Next.js implementation)
In production, can be replaced with Redis
"""
from typing import Optional, Any, Dict
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class CacheService:
    """Simple in-memory cache with TTL"""
    
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}
    
    def get(self, key: str) -> Optional[Any]:
        """Get cached value if not expired"""
        entry = self._cache.get(key)
        if not entry:
            return None
        
        if datetime.now() > entry["expires"]:
            del self._cache[key]
            return None
        
        return entry["data"]
    
    def set(self, key: str, value: Any, ttl_seconds: int = 60):
        """Set cached value with TTL"""
        expires = datetime.now() + timedelta(seconds=ttl_seconds)
        self._cache[key] = {
            "data": value,
            "expires": expires,
            "timestamp": datetime.now().timestamp() * 1000  # milliseconds
        }
    
    def has(self, key: str) -> bool:
        """Check if key exists and is not expired"""
        entry = self._cache.get(key)
        if not entry:
            return False
        
        if datetime.now() > entry["expires"]:
            del self._cache[key]
            return False
        
        return True
    
    def clear(self):
        """Clear all cache"""
        self._cache.clear()
    
    def get_timestamp(self, key: str) -> Optional[float]:
        """Get timestamp for cached entry"""
        entry = self._cache.get(key)
        if entry:
            return entry.get("timestamp")
        return None


# Global cache instance
cache_service = CacheService()



















