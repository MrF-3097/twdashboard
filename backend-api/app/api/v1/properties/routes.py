"""
Properties endpoints
GET /api/v1/properties - List all properties with filters
GET /api/v1/properties/{property_id} - Get property detail
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.services.rebs_client import rebs_client
from app.services.cache_service import cache_service
from app.core.config import settings
import logging
import asyncio

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/properties", tags=["Properties"])

CACHE_TTL = 60  # 60 seconds


async def fetch_properties_page(page: int, page_size: int = 100) -> dict:
    """Fetch a single page of properties from REBS API"""
    query_params = {
        "page": str(page),
        "page_size": str(page_size),
        "ordering": "-date_added",
    }
    
    try:
        data = await rebs_client.get("/properties/", params=query_params)
        
        # Handle different response formats
        properties = []
        if isinstance(data, list):
            properties = data
        elif isinstance(data, dict):
            properties = (
                data.get("results") or
                data.get("objects") or
                []
            )
        
        # Filter active properties
        active_properties = [
            p for p in properties
            if (p.get("availability") == 1 or
                p.get("availability") is True or
                p.get("availability") == "1" or
                p.get("active") is True)
        ]
        
        # Extract metadata
        total_count = 0
        if isinstance(data, dict):
            total_count = (
                data.get("meta", {}).get("total_count") or
                data.get("count") or
                data.get("total_count") or
                0
            )
        
        has_next = (
            (isinstance(data, dict) and (
                data.get("meta", {}).get("next") is not None or
                data.get("next") is not None
            )) or
            len(properties) == page_size
        )
        
        return {
            "properties": active_properties,
            "all_properties": properties,
            "total_count": total_count,
            "has_next": has_next
        }
    
    except Exception as e:
        logger.error(f"Error fetching properties page {page}: {e}")
        raise


async def fetch_all_properties() -> dict:
    """Fetch all properties with parallel pagination and caching"""
    cache_key = "properties-all"
    
    # Check cache
    cached = cache_service.get(cache_key)
    if cached:
        logger.info(f"[Properties API] Returning cached data ({len(cached.get('objects', []))} properties)")
        return cached
    
    logger.info("[Properties API] Fetching all properties (cache miss or expired)")
    
    # First, get the first page
    first_page = await fetch_properties_page(1, 100)
    all_properties = first_page["properties"][:]
    total_count = first_page["total_count"] or len(first_page["all_properties"])
    
    # If we got less than a full page, we're done
    if len(first_page["all_properties"]) < 100:
        result = {
            "objects": all_properties,
            "meta": {
                "total_count": total_count or len(all_properties),
                "limit": 100,
                "offset": 0,
            }
        }
        cache_service.set(cache_key, result, CACHE_TTL)
        return result
    
    # Calculate how many pages we need
    page_size = 100
    total_pages = (
        (total_count // page_size) + 1
        if total_count > 0
        else (len(first_page["all_properties"]) // page_size) + 10
    )
    
    # Fetch remaining pages in parallel (max 10 at a time)
    batch_size = 10
    pages_to_fetch = min(total_pages - 1, 100)  # Safety limit
    
    for batch_start in range(2, pages_to_fetch + 2, batch_size):
        batch_end = min(batch_start + batch_size - 1, pages_to_fetch + 1)
        
        # Create batch of tasks
        tasks = [
            fetch_properties_page(page, page_size)
            for page in range(batch_start, batch_end + 1)
        ]
        
        try:
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for result in results:
                if isinstance(result, Exception):
                    logger.error(f"Error in batch: {result}")
                    continue
                
                if result.get("properties"):
                    all_properties.extend(result["properties"])
                
                # Stop if we got less than a full page
                if len(result.get("all_properties", [])) < page_size:
                    break
            
            # If we've fetched all we need, stop
            if total_count > 0 and len(all_properties) >= total_count:
                break
        
        except Exception as e:
            logger.error(f"Error in batch fetch: {e}")
            break
    
    logger.info(f"[Properties API] Fetched {len(all_properties)} active properties total")
    
    result = {
        "objects": all_properties,
        "meta": {
            "total_count": total_count or len(all_properties),
            "limit": page_size,
            "offset": 0,
        }
    }
    
    cache_service.set(cache_key, result, CACHE_TTL)
    return result


@router.get("")
async def list_properties():
    """
    List all active properties from REBS API
    
    Returns all properties with parallel pagination and caching
    """
    try:
        import time
        start_time = time.time()
        
        properties_data = await fetch_all_properties()
        
        duration_ms = int((time.time() - start_time) * 1000)
        logger.info(f"[Properties API] Successfully fetched {len(properties_data['objects'])} properties in {duration_ms}ms")
        
        return {
            "success": True,
            "data": properties_data,
            "_performance": {
                "duration_ms": duration_ms,
                "cached": cache_service.has("properties-all")
            }
        }
    
    except Exception as e:
        logger.error("[Properties API] Error fetching properties", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch properties: {str(e)}"
        )


@router.get("/{property_id}")
async def get_property_detail(property_id: int):
    """
    Get single property detail from REBS API
    """
    try:
        property_data = await rebs_client.get(f"/properties/{property_id}/")
        return {
            "success": True,
            "data": property_data
        }
    except Exception as e:
        logger.error(f"[Properties API] Error fetching property {property_id}: {e}")
        raise HTTPException(
            status_code=404,
            detail=f"Property not found: {property_id}"
        )



















