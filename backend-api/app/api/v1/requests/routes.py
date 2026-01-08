"""
Requests endpoints
GET /api/v1/requests - List all requests with filters
GET /api/v1/requests/{request_id} - Get request detail
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.services.rebs_client import rebs_client
from app.services.cache_service import cache_service
import logging
import asyncio

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/requests", tags=["Requests"])

CACHE_TTL = 60  # 60 seconds


async def fetch_requests_page(
    base_params: dict,
    offset: int,
    limit: int = 20
) -> dict:
    """Fetch a single page of requests from REBS API"""
    query_params = base_params.copy()
    query_params["offset"] = str(offset)
    query_params["limit"] = str(limit)
    
    try:
        # Build query string
        query_string = "&".join([f"{k}={v}" for k, v in query_params.items()])
        data = await rebs_client.get(f"/requests/?{query_string}")
        
        # Handle different response formats
        requests = []
        if isinstance(data, list):
            requests = data
        elif isinstance(data, dict):
            requests = (
                data.get("results") or
                data.get("objects") or
                []
            )
        
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
            len(requests) == limit
        )
        
        return {
            "requests": requests,
            "total_count": total_count,
            "has_next": has_next
        }
    
    except Exception as e:
        logger.error(f"Error fetching requests page (offset={offset}): {e}")
        raise


async def fetch_all_requests(base_params: dict) -> dict:
    """Fetch all requests with parallel pagination and caching"""
    cache_key = "&".join([f"{k}={v}" for k, v in sorted(base_params.items())])
    
    # Check cache
    cached = cache_service.get(cache_key)
    if cached:
        logger.info(f"[Requests API] Returning cached data ({len(cached.get('objects', []))} requests)")
        return cached
    
    logger.info("[Requests API] Fetching all requests (cache miss or expired)")
    
    # First, get the first page
    first_page = await fetch_requests_page(base_params, 0, 20)
    all_requests = first_page["requests"][:]
    total_count = first_page["total_count"] or len(first_page["requests"])
    
    # If we got less than 20, we're done
    if len(first_page["requests"]) < 20:
        result = {
            "objects": all_requests,
            "meta": {
                "total_count": total_count or len(all_requests),
                "page": 1,
                "page_size": len(all_requests),
                "has_next": False,
                "has_previous": False,
            }
        }
        cache_service.set(cache_key, result, CACHE_TTL)
        return result
    
    # Calculate how many pages we need
    items_per_page = 20
    total_pages = (
        (total_count // items_per_page) + 1
        if total_count > 0
        else (len(first_page["requests"]) // items_per_page) + 10
    )
    
    # Fetch remaining pages in parallel (max 10 at a time)
    batch_size = 10
    pages_to_fetch = min(total_pages - 1, 100)  # Safety limit
    
    for batch_start in range(1, pages_to_fetch + 1, batch_size):
        batch_end = min(batch_start + batch_size - 1, pages_to_fetch)
        
        # Create batch of tasks
        tasks = [
            fetch_requests_page(base_params, page * items_per_page, items_per_page)
            for page in range(batch_start, batch_end + 1)
        ]
        
        try:
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for result in results:
                if isinstance(result, Exception):
                    logger.error(f"Error in batch: {result}")
                    continue
                
                if result.get("requests"):
                    all_requests.extend(result["requests"])
                
                # Stop if we got less than a full page
                if len(result.get("requests", [])) < items_per_page:
                    break
            
            # If we've fetched all we need, stop
            if total_count > 0 and len(all_requests) >= total_count:
                break
        
        except Exception as e:
            logger.error(f"Error in batch fetch: {e}")
            break
    
    logger.info(f"[Requests API] Fetched {len(all_requests)} requests total")
    
    result = {
        "objects": all_requests,
        "meta": {
            "total_count": total_count or len(all_requests),
            "page": 1,
            "page_size": len(all_requests),
            "has_next": False,
            "has_previous": False,
        }
    }
    
    cache_service.set(cache_key, result, CACHE_TTL)
    return result


@router.get("")
async def list_requests(
    ordering: Optional[str] = Query(default="-date_added", description="Ordering field"),
    agent: Optional[int] = Query(default=None, description="Filter by agent ID"),
    property_type: Optional[int] = Query(default=None, description="Filter by property type"),
    transaction_type: Optional[int] = Query(default=None, description="Filter by transaction type"),
    price_filter_gte: Optional[float] = Query(default=None, description="Min price"),
    price_filter_lte: Optional[float] = Query(default=None, description="Max price"),
    rooms_filter_gte: Optional[int] = Query(default=None, description="Min rooms"),
    rooms_filter_lte: Optional[int] = Query(default=None, description="Max rooms"),
):
    """
    List all requests from REBS API with optional filters
    
    Supports filtering by agent, property type, transaction type, price range, and rooms
    """
    try:
        import time
        start_time = time.time()
        
        # Build base params
        base_params = {"ordering": ordering}
        if agent:
            base_params["agent"] = str(agent)
        if property_type:
            base_params["property_type"] = str(property_type)
        if transaction_type:
            base_params["transaction_type"] = str(transaction_type)
        if price_filter_gte:
            base_params["price_filter_gte"] = str(price_filter_gte)
        if price_filter_lte:
            base_params["price_filter_lte"] = str(price_filter_lte)
        if rooms_filter_gte:
            base_params["rooms_filter_gte"] = str(rooms_filter_gte)
        if rooms_filter_lte:
            base_params["rooms_filter_lte"] = str(rooms_filter_lte)
        
        requests_data = await fetch_all_requests(base_params)
        
        duration_ms = int((time.time() - start_time) * 1000)
        logger.info(f"[Requests API] Successfully fetched {len(requests_data['objects'])} requests in {duration_ms}ms")
        
        return {
            "success": True,
            "data": requests_data,
            "_performance": {
                "duration_ms": duration_ms,
                "cached": cache_service.has("&".join([f"{k}={v}" for k, v in sorted(base_params.items())]))
            }
        }
    
    except Exception as e:
        logger.error("[Requests API] Error fetching requests", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch requests: {str(e)}"
        )


@router.get("/{request_id}")
async def get_request_detail(request_id: int):
    """
    Get single request detail from REBS API
    """
    try:
        request_data = await rebs_client.get(f"/requests/{request_id}/")
        return {
            "success": True,
            "data": request_data
        }
    except Exception as e:
        logger.error(f"[Requests API] Error fetching request {request_id}: {e}")
        raise HTTPException(
            status_code=404,
            detail=f"Request not found: {request_id}"
        )



















