# Project Summary

## Problem
No reliable offline apps exist for celiacs to identify gluten and cross-contamination risks in food products.

## Proposal
Local-first companion app that:
- Stores user settings securely offline
- Enables product search/scanning for risk assessment
- Provides product update notifications
- Uses AI to aggregate official and community data

## Non-functional Requirements
- Full offline & mobile support
- Accurate model with safeguards against hallucinations
- Strategy for handling outdated data
- Response time <30s (95th percentile <1min)
- Network resilient
- Cloud-grade reliability
- Efficient token usage with local models for cost optimization
---
# Celiac Food Checker API

This is a FastAPI application that helps celiacs determine if a certain food contains gluten.

## Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd your-repo
   ```

2. **Create and activate a virtual environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows use `.\venv\Scripts\activate`
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application**:
   ```bash
   uvicorn app.main:app --reload
   ```

## API Endpoints

- **Search for an ingredient**: `GET /v1/foods?q={query}`
- **Search food by product id/food id**: `GET /v1/foods/{foodId}`

# FastAPI Application

## Running Tests

To ensure the functionality of the application, you can run the tests using `pytest`. Follow the instructions below:

### Running the Tests

1. Navigate to the directory containing your test files.
2. Run the following command to execute the tests:

```bash
pytest test_app.py
```

This command will run all the tests defined in `test_app.py`. If you want to run all tests in the directory, simply use:

```bash
pytest
```

### Test Output

After running the tests, you will see output indicating which tests passed or failed. Ensure all tests pass to confirm that the application is functioning as expected.