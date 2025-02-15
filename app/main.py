from fastapi import FastAPI, HTTPException
from typing import Optional

app = FastAPI()

# Mock data for demonstration purposes
mock_data = {
    "1": {"foodId": "1", "glutenFree": {"gluten": "no", "description": "Rice is naturally gluten-free."}},
    "2": {"foodId": "2", "glutenFree": {"gluten": "yes", "description": "Wheat contains gluten."}},
    # Add more mock data as needed
}

@app.get("/v1/foods")
async def search_foods(q: Optional[str] = None):
    # This is a simple search implementation
    results = [food for food in mock_data.values() if q.lower() in food['glutenFree']['description'].lower()]
    if not results:
        raise HTTPException(status_code=404, detail="Food not found")
    return results

@app.get("/v1/foods/{food_id}")
async def get_food_by_id(food_id: str):
    food = mock_data.get(food_id)
    if not food:
        raise HTTPException(status_code=404, detail="Food not found")
    return food