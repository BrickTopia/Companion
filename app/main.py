from fastapi import FastAPI, HTTPException, Request
from typing import Optional
import httpx
from starlette.middleware.trustedhost import TrustedHostMiddleware

app = FastAPI()
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])

SEARCH_API_URL = "https://world.openfoodfacts.org/cgi/search.pl"

def get_product_info(product_data):
            # Extract necessary components
        product_info = {
            "code": product_data['code'],
            "product": {
                "name": product_data['product'].get('product_name', 'Unknown Product'),
                "brands": product_data['product'].get('brands', 'Unknown Brand'),
                "allergens": product_data['product'].get('allergens_tags', []),
                "ingredients": product_data['product'].get('ingredients_text', 'No ingredients listed').split(', '),
                "is_gluten_free": "gluten" not in product_data['product'].get('ingredients_text', '').lower(),
                "categories": product_data['product'].get('categories_tags', []),
                "image_url": product_data['product'].get('image_url', ''),
                "nutritional_info": {
                    "energy_kcal": product_data['product'].get('nutriments', {}).get('energy-kcal_100g', 0),
                    "fat": product_data['product'].get('nutriments', {}).get('fat_100g', 0),
                    "saturated_fat": product_data['product'].get('nutriments', {}).get('saturated-fat_100g', 0),
                    "carbohydrates": product_data['product'].get('nutriments', {}).get('carbohydrates_100g', 0),
                    "sugars": product_data['product'].get('nutriments', {}).get('sugars_100g', 0),
                    "proteins": product_data['product'].get('nutriments', {}).get('proteins_100g', 0),
                    "salt": product_data['product'].get('nutriments', {}).get('salt_100g', 0)
                }
            }
        }
        
        return product_info

def get_request_headers(request: Request):
    """Extract user-specific information and create headers."""
    user_id = request.headers.get("X-User-ID", "default-user")
    user_ip = request.client.host  # Get the user's IP address
    user_agent = f"Companion - User {user_id}"
    
    headers = {
        "User-Agent": user_agent,
        "X-Forwarded-For": user_ip  # Include the user's IP in the headers
    }
    
    return headers

# GET PRODUCTS BY SEARCH
## Rate Limit : 10 RPM
@app.get("/products")
async def search_products(
    request: Request,
    search_terms: str,
    page: int = 1,
    page_size: int = 5,
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
    
    headers = get_request_headers(request)

    async with httpx.AsyncClient() as client:
        response = await client.get(SEARCH_API_URL, params=params, headers=headers)
        if response.status_code == 429:
            raise HTTPException(status_code=429, detail="Too many requests. Please try again in 1 minute.")
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Error fetching search results")
        
        search_data = response.json()
        
        return search_data

# GET PRODUCT BY BARCODE
## Rate Limit : 100 RPM
@app.get("/products/{barcode}")
async def get_product_by_barcode(barcode: str, request: Request, product_type: str = "all", fields: Optional[str] = None):
    params = {
        "product_type": product_type,
        "fields": fields
    }
    
    headers = get_request_headers(request)
    
    async with httpx.AsyncClient() as client:
        response = await client.get(f"https://world.openfoodfacts.net/api/v2/product/{barcode}", params=params, headers=headers)
        if response.status_code == 302:
            raise HTTPException(status_code=302, detail="Redirect to another server")
        elif response.status_code == 404:
            raise HTTPException(status_code=404, detail="Product not found in Open Food Facts")
        elif response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Error fetching product data")
        
        product_data = response.json()
        return get_product_info(product_data)