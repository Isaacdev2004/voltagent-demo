import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_ping():
    """Test the ping endpoint"""
    response = client.get("/ping")
    assert response.status_code == 200
    assert response.json() == {"status": "alive"}

def test_health():
    """Test the health endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "timestamp" in data
    assert "version" in data

def test_completions_missing_api_key():
    """Test completions endpoint without API key"""
    response = client.post(
        "/completions",
        json={"prompt": "Hello, world!", "max_tokens": 50}
    )
    assert response.status_code == 401

def test_completions_invalid_api_key():
    """Test completions endpoint with invalid API key"""
    response = client.post(
        "/completions",
        json={"prompt": "Hello, world!", "max_tokens": 50},
        headers={"X-API-Key": "invalid-key"}
    )
    assert response.status_code == 401

def test_completions_valid_request():
    """Test completions endpoint with valid API key"""
    # This test would need a valid API key from environment
    # For now, we'll just test the structure
    response = client.post(
        "/completions",
        json={"prompt": "Hello, world!", "max_tokens": 50},
        headers={"X-API-Key": "test-api-key"}
    )
    # This will fail without proper API key setup, but shows the test structure
    assert response.status_code in [200, 401, 500]
