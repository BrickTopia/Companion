from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_get_product_by_barcode():
    # Example barcode to test
    barcode = "3017624010701"
    
    # Send a GET request to the endpoint with a user ID
    response = client.get(f"/products/{barcode}", headers={"X-User-ID": "test-user-123"})
    
    # Assert the response status code
    assert response.status_code == 200
    
    # Assert the response contains expected data
    data = response.json()
    assert "product" in data
    assert data["code"] == barcode

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
    assert len(data) > 0

# debug
def main():
    # Call the test functions
    test_get_product_by_barcode()
    test_search_products_with_user_header()
    print("All tests passed!")

if __name__ == "__main__":
    main()