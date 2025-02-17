from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_get_product_by_barcode():
    # Example barcode to test
    barcode = "3017624010701"
    
    # Send a GET request to the endpoint
    response = client.get(f"/products/{barcode}")
    
    # Assert the response status code
    assert response.status_code == 200
    
    # Assert the response contains expected data
    data = response.json()
    assert "product" in data
    assert data["product"]["code"] == barcode

# def test_search_products():
#     # Example search term
#     search_terms = "coke"
    
#     # Send a GET request to the search endpoint
#     response = client.get("/products", params={"search_terms": search_terms})
    
#     # Assert the response status code
#     assert response.status_code == 200
    
#     # Assert the response contains expected data
#     data = response.json()
#     print(data)
#     assert "products" in data
#     assert len(data["products"]) > 0

def test_search_products_with_user_header():
    # Test parameters
    search_terms = "coke"
    test_user_id = "test-user-123"
    
    # Send GET request with custom header
    response = client.get(
        "/products", 
        params={"search_terms": search_terms},
        headers={"X-User-ID": test_user_id}
    )
    
    # Assert response status code
    assert response.status_code == 200
    
    # Assert the response contains expected data
    data = response.json()
    assert "products" in data
    
    # Unfortunately we can't verify the User-Agent header directly in the response
    # as it's sent to the external API. We can only verify the endpoint works
    # with the custom header present