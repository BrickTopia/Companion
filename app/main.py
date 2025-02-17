from fastapi import FastAPI, HTTPException, Request
from typing import Optional
import httpx

app = FastAPI()

SEARCH_API_URL = "https://world.openfoodfacts.org/cgi/search.pl"

# GET PRODUCTS BY SEARCH
@app.get("/products")
async def search_products(
    request: Request,
    search_terms: str,
    page: int = 1,
    page_size: int = 20,
    sort_by: Optional[str] = None,
    nocache: int = 1
):
    params = {
        "search_terms": search_terms,
        "search_simple": 1,
        "action": "process",
        "json": 1,
        "page": page,
        "page_size": page_size,
        "sort_by": sort_by,
        "nocache": nocache
    }
    
    # Extract user-specific information from the request
    user_id = request.headers.get("X-User-ID", "default-user")
    
    # Create a user-specific User-Agent
    user_agent = f"Companion - User {user_id}"
    
    headers = {
        "User-Agent": user_agent
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(SEARCH_API_URL, params=params, headers=headers)
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Error fetching search results")
        
        search_results = response.json()
        
        return search_results

# GET PRODUCT BY BARCODE
@app.get("/products/{barcode}")
async def get_product_by_barcode(barcode: str, product_type: str = "all", fields: Optional[str] = None):
    params = {
        "product_type": product_type,
        "fields": fields
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(f"https://world.openfoodfacts.net/api/v2/product/{barcode}", params=params)
        if response.status_code == 302:
            raise HTTPException(status_code=302, detail="Redirect to another server")
        elif response.status_code == 404:
            raise HTTPException(status_code=404, detail="Product not found in Open Food Facts")
        elif response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Error fetching product data")
        
        product_data = response.json()
        
        return product_data