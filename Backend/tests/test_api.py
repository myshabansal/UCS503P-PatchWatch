import pytest
from fastapi.testclient import TestClient


class TestHealthEndpoints:
    """Test health and status endpoints."""
    
    def test_root_endpoint(self, client):
        """Test root endpoint."""
        response = client.get("/")
        assert response.status_code == 200
        
        data = response.json()
        assert data["message"] == "PatchWatch API is running"
        assert data["version"] == "2.0.0"
        assert data["status"] == "healthy"
    
    def test_health_endpoint(self, client):
        """Test health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "healthy"
        assert data["version"] == "2.0.0"


class TestAuthenticationEndpoints:
    """Test authentication endpoints."""
    
    def test_register_user(self, client):
        """Test user registration."""
        user_data = {
            "email": "newuser@example.com",
            "password": "NewPassword123!",
            "full_name": "New User"
        }
        
        response = client.post("/api/v1/auth/register", json=user_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["email"] == user_data["email"]
        assert data["full_name"] == user_data["full_name"]
        assert data["is_active"] is True
        assert "id" in data
    
    def test_register_duplicate_email(self, client, test_user):
        """Test registration with duplicate email."""
        user_data = {
            "email": test_user.email,
            "password": "NewPassword123!",
            "full_name": "Duplicate User"
        }
        
        response = client.post("/api/v1/auth/register", json=user_data)
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"]
    
    def test_register_weak_password(self, client):
        """Test registration with weak password."""
        user_data = {
            "email": "weakpass@example.com",
            "password": "weakweakweak",
            "full_name": "Weak Password User"
        }
        
        response = client.post("/api/v1/auth/register", json=user_data)
        assert response.status_code == 400
        assert "Password validation failed" in response.json()["detail"]
    
    def test_login_valid_credentials(self, client, test_user):
        """Test login with valid credentials."""
        login_data = {
            "email": test_user.email,
            "password": "testpassword123"
        }
        
        response = client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    
    def test_login_invalid_credentials(self, client, test_user):
        """Test login with invalid credentials."""
        login_data = {
            "email": test_user.email,
            "password": "wrongpassword"
        }
        
        response = client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == 401
        assert "Invalid email or password" in response.json()["detail"]
    
    def test_login_nonexistent_user(self, client):
        """Test login with nonexistent user."""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "password123"
        }
        
        response = client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == 401
        assert "Invalid email or password" in response.json()["detail"]
    
    def test_get_current_user(self, client, auth_headers):
        """Test getting current user information."""
        response = client.get("/api/v1/auth/me", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["full_name"] == "Test User"
        assert data["is_active"] is True
    
    def test_get_current_user_unauthorized(self, client):
        """Test getting current user without authentication."""
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 403


class TestProjectEndpoints:
    """Test project management endpoints."""
    
    def test_create_project(self, client, auth_headers):
        """Test creating a new project."""
        project_data = {
            "name": "Test Project",
            "description": "A test project for PatchWatch",
            "repository_url": "https://github.com/user/repo"
        }
        
        response = client.post("/api/v1/projects/", json=project_data, headers=auth_headers)
        assert response.status_code == 201
        
        data = response.json()
        assert data["name"] == project_data["name"]
        assert data["description"] == project_data["description"]
        assert data["repository_url"] == project_data["repository_url"]
        assert "id" in data
    
    def test_create_project_unauthorized(self, client):
        """Test creating project without authentication."""
        project_data = {"name": "Test Project"}
        
        response = client.post("/api/v1/projects/", json=project_data)
        assert response.status_code == 403
    
    def test_list_projects(self, client, auth_headers):
        """Test listing user projects."""
        # Create a project first
        project_data = {"name": "Test Project", "description": "Test"}
        client.post("/api/v1/projects/", json=project_data, headers=auth_headers)
        
        response = client.get("/api/v1/projects/", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) >= 1
        assert data[0]["name"] == "Test Project"
    
    def test_get_project(self, client, auth_headers):
        """Test getting a specific project."""
        # Create a project first
        project_data = {"name": "Get Test Project", "description": "Test"}
        create_response = client.post("/api/v1/projects/", json=project_data, headers=auth_headers)
        project_id = create_response.json()["id"]
        
        response = client.get(f"/api/v1/projects/{project_id}", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == "Get Test Project"
        assert data["id"] == project_id
    
    def test_update_project(self, client, auth_headers):
        """Test updating a project."""
        # Create a project first
        project_data = {"name": "Update Test Project", "description": "Test"}
        create_response = client.post("/api/v1/projects/", json=project_data, headers=auth_headers)
        project_id = create_response.json()["id"]
        
        update_data = {"name": "Updated Project Name"}
        response = client.patch(f"/api/v1/projects/{project_id}", json=update_data, headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == "Updated Project Name"
        assert data["description"] == "Test"  # Should remain unchanged
    
    def test_delete_project(self, client, auth_headers):
        """Test deleting a project."""
        # Create a project first
        project_data = {"name": "Delete Test Project", "description": "Test"}
        create_response = client.post("/api/v1/projects/", json=project_data, headers=auth_headers)
        project_id = create_response.json()["id"]
        
        response = client.delete(f"/api/v1/projects/{project_id}", headers=auth_headers)
        assert response.status_code == 204
        
        # Verify project is deleted
        get_response = client.get(f"/api/v1/projects/{project_id}", headers=auth_headers)
        assert get_response.status_code == 404


class TestLegacyEndpoints:
    """Test legacy endpoint redirects."""
    
    def test_legacy_scan_endpoints(self, client):
        """Test that legacy endpoints return proper redirect responses."""
        response = client.get("/api/scan")
        assert response.status_code == 301
        assert "moved" in response.json()["detail"].lower()
        
        response = client.post("/scan")
        assert response.status_code == 301
        assert "moved" in response.json()["detail"].lower()
        
        response = client.get("/scans")
        assert response.status_code == 301
        assert "moved" in response.json()["detail"].lower()
        
        response = client.get("/stats")
        assert response.status_code == 301
        assert "moved" in response.json()["detail"].lower()