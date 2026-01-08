"""
REBS API Client Service
Async HTTP client pentru comunicarea cu REBS CRM API
Similar cu rebs-client.ts din Next.js
"""
import httpx
from typing import Optional, Dict, Any
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class REBSClient:
    """
    Async REBS API client
    Handles authentication, timeouts, and error handling
    """
    
    def __init__(self):
        self.base_url = settings.REBS_API_BASE_URL.rstrip('/')
        self.api_token = settings.REBS_API_TOKEN
        self.timeout = 30.0
        
        if not self.api_token:
            logger.warning("REBS_API_TOKEN not set. API calls will fail.")
    
    def _build_url(self, path: str) -> str:
        """Build full URL from path"""
        if not path:
            return self.base_url
        
        # If path is already a full URL, return it
        if path.startswith('http://') or path.startswith('https://'):
            return path
        
        # Ensure path starts with /
        if not path.startswith('/'):
            path = f'/{path}'
        
        return f"{self.base_url}{path}"
    
    async def fetch(
        self,
        path: str,
        method: str = "GET",
        params: Optional[Dict[str, Any]] = None,
        json: Optional[Dict[str, Any]] = None,
        data: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
        timeout: Optional[float] = None
    ) -> Any:
        """
        Make async request to REBS API
        
        Args:
            path: API endpoint path
            method: HTTP method (GET, POST, etc.)
            params: Query parameters
            json: JSON body data
            data: Form data
            headers: Additional headers
            timeout: Request timeout in seconds
        
        Returns:
            JSON response data
        
        Raises:
            httpx.HTTPError: If request fails
        """
        if not self.api_token:
            raise ValueError("REBS_API_TOKEN is required for API calls")
        
        url = self._build_url(path)
        request_timeout = timeout or self.timeout
        
        # Default headers
        request_headers = {
            "Authorization": f"Token {self.api_token}",
            "Accept": "application/json",
        }
        
        # Add custom headers
        if headers:
            request_headers.update(headers)
        
        # Set Content-Type for JSON requests
        if json and "Content-Type" not in request_headers:
            request_headers["Content-Type"] = "application/json"
        
        try:
            async with httpx.AsyncClient(timeout=request_timeout) as client:
                response = await client.request(
                    method=method.upper(),
                    url=url,
                    params=params,
                    json=json,
                    data=data,
                    headers=request_headers,
                )
                
                # Raise exception for HTTP errors
                response.raise_for_status()
                
                # Try to parse JSON
                try:
                    return response.json()
                except Exception as e:
                    logger.error(f"Failed to parse JSON response: {e}")
                    return response.text
        
        except httpx.TimeoutException as e:
            logger.error(f"REBS API timeout after {request_timeout}s: {path}")
            raise Exception(f"Request timeout: {path}") from e
        
        except httpx.HTTPStatusError as e:
            error_body = e.response.text if e.response else "Unknown error"
            logger.error(f"REBS API error {e.response.status_code}: {error_body}")
            raise Exception(f"HTTP {e.response.status_code}: {error_body}") from e
        
        except httpx.RequestError as e:
            logger.error(f"REBS API request error: {e}")
            raise Exception(f"Request failed: {str(e)}") from e
    
    async def get(self, path: str, **kwargs) -> Any:
        """GET request shorthand"""
        return await self.fetch(path, method="GET", **kwargs)
    
    async def post(self, path: str, **kwargs) -> Any:
        """POST request shorthand"""
        return await self.fetch(path, method="POST", **kwargs)
    
    async def put(self, path: str, **kwargs) -> Any:
        """PUT request shorthand"""
        return await self.fetch(path, method="PUT", **kwargs)
    
    async def delete(self, path: str, **kwargs) -> Any:
        """DELETE request shorthand"""
        return await self.fetch(path, method="DELETE", **kwargs)


# Global REBS client instance
rebs_client = REBSClient()



















