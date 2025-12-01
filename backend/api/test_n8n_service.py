import pytest
import httpx
from unittest.mock import AsyncMock, MagicMock
from api.n8n_service import N8nClient, N8nConnectionError, WorkflowNotFoundError, parse_input_schema, detect_trigger_type


# Pytest fixtures for mocking httpx responses
@pytest.fixture
def mock_httpx_client():
    """Mock httpx AsyncClient for testing."""
    return AsyncMock(spec=httpx.AsyncClient)


@pytest.fixture
def sample_workflow_data():
    """Sample workflow data for testing."""
    return {
        "id": "123",
        "name": "Test Workflow",
        "active": True,
        "nodes": [
            {
                "id": "node1",
                "name": "When clicking 'execute'",
                "type": "n8n-nodes-base.manualTrigger",
                "parameters": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "email_body": {"type": "string", "description": "Body of email"},
                            "customer_id": {"type": "number"}
                        },
                        "required": ["email_body"],
                        "definitions": {}
                    }
                }
            }
        ]
    }


@pytest.fixture
def sample_workflows_list():
    """Sample workflows list for testing."""
    return [
        {"id": "1", "name": "Workflow 1", "active": True},
        {"id": "2", "name": "Workflow 2", "active": False}
    ]


@pytest.fixture
def n8n_client_with_mocked_responses(mock_httpx_client):
    """N8nClient instance with mocked httpx responses."""
    client = N8nClient("https://example-n8n.com/", "test-api-key")
    # Replace the actual client with the mock
    client.client = mock_httpx_client
    return client


@pytest.fixture
def mock_successful_response():
    """Mock a successful httpx response."""
    response = MagicMock(spec=httpx.Response)
    response.status_code = 200
    response.json.return_value = {"key": "value"}
    return response


@pytest.fixture
def mock_401_response():
    """Mock a 401 unauthorized httpx response."""
    response = MagicMock(spec=httpx.Response)
    response.status_code = 401
    response.text = "Unauthorized"
    return response


@pytest.fixture
def mock_404_response():
    """Mock a 404 not found httpx response."""
    response = MagicMock(spec=httpx.Response)
    response.status_code = 404
    response.text = "Not Found"
    return response


class TestN8nClient:
    """Test class for N8nClient functionality."""
    
    @pytest.mark.asyncio
    async def test_get_workflows_success(self, n8n_client_with_mocked_responses, sample_workflows_list):
        """Test successful retrieval of workflows."""
        # Mock the response
        mock_response = MagicMock(spec=httpx.Response)
        mock_response.status_code = 200
        mock_response.json.return_value = {"data": sample_workflows_list}
        
        # Set up the mock client's request method
        n8n_client_with_mocked_responses.client.request = AsyncMock(return_value=mock_response)
        
        # Call the method
        result = await n8n_client_with_mocked_responses.get_workflows()
        
        # Assertions
        assert len(result) == 2
        assert result[0]["id"] == "1"
        assert result[0]["name"] == "Workflow 1"

    @pytest.mark.asyncio
    async def test_get_workflow_by_id_success(self, n8n_client_with_mocked_responses, sample_workflow_data):
        """Test successful retrieval of a specific workflow."""
        # Mock the response
        mock_response = MagicMock(spec=httpx.Response)
        mock_response.status_code = 200
        mock_response.json.return_value = sample_workflow_data
        
        # Set up the mock client's request method
        n8n_client_with_mocked_responses.client.request = AsyncMock(return_value=mock_response)
        
        # Call the method
        result = await n8n_client_with_mocked_responses.get_workflow_by_id("123")
        
        # Assertions
        assert result["id"] == "123"
        assert result["name"] == "Test Workflow"

    @pytest.mark.asyncio
    async def test_validate_connection_success(self, n8n_client_with_mocked_responses):
        """Test successful validation of connection."""
        # Mock the response
        mock_response = MagicMock(spec=httpx.Response)
        mock_response.status_code = 200
        mock_response.json.return_value = {"data": []}
        
        # Set up the mock client's request method
        n8n_client_with_mocked_responses.client.request = AsyncMock(return_value=mock_response)
        
        # Call the method
        result = await n8n_client_with_mocked_responses.validate_connection()
        
        # Assertions
        assert result is True

    @pytest.mark.asyncio
    async def test_validate_connection_failure(self, n8n_client_with_mocked_responses, mock_401_response):
        """Test failed validation of connection due to 401."""
        # Set up the mock client's request method
        n8n_client_with_mocked_responses.client.request = AsyncMock(return_value=mock_401_response)
        
        # Call the method
        result = await n8n_client_with_mocked_responses.validate_connection()
        
        # Assertions
        assert result is False

    @pytest.mark.asyncio
    async def test_n8n_connection_error(self):
        """Test that N8nConnectionError is raised appropriately."""
        with pytest.raises(N8nConnectionError):
            raise N8nConnectionError("Test connection error")

    @pytest.mark.asyncio
    async def test_workflow_not_found_error(self):
        """Test that WorkflowNotFoundError is raised appropriately."""
        with pytest.raises(WorkflowNotFoundError):
            raise WorkflowNotFoundError("Test workflow not found error")


class TestUtilityFunctions:
    """Test class for utility functions."""
    
    @pytest.mark.asyncio
    async def test_parse_input_schema_with_valid_schema(self, sample_workflow_data):
        """Test parsing input schema when schema exists in workflow."""
        schema = sample_workflow_data["nodes"][0]["parameters"]["schema"]
        result = parse_input_schema(sample_workflow_data)
        
        # Assertions
        assert result == schema

    @pytest.mark.asyncio
    async def test_detect_trigger_type_webhook(self):
        """Test detecting webhook trigger type."""
        workflow_json = {
            "nodes": [
                {
                    "name": "Webhook",
                    "type": "n8n-nodes-base.webhook",
                    "parameters": {}
                }
            ]
        }
        
        trigger_type, node_definition = detect_trigger_type(workflow_json)
        
        # Assertions
        assert trigger_type == "webhook"
        assert node_definition == workflow_json["nodes"][0]

    @pytest.mark.asyncio
    async def test_detect_trigger_type_manual(self):
        """Test detecting manual trigger type."""
        workflow_json = {
            "nodes": [
                {
                    "name": "When clicking 'execute'",
                    "type": "n8n-nodes-base.manualTrigger",
                    "parameters": {}
                }
            ]
        }
        
        trigger_type, node_definition = detect_trigger_type(workflow_json)
        
        # Assertions
        assert trigger_type == "manual"
        assert node_definition == workflow_json["nodes"][0]

    @pytest.mark.asyncio
    async def test_detect_trigger_type_unknown(self):
        """Test detecting unknown trigger type."""
        workflow_json = {
            "nodes": [
                {
                    "name": "Some Other Node",
                    "type": "n8n-nodes-base.someOtherNode",
                    "parameters": {}
                }
            ]
        }
        
        trigger_type, node_definition = detect_trigger_type(workflow_json)
        
        # Assertions
        assert trigger_type == "unknown"
        assert node_definition == workflow_json["nodes"][0]

    @pytest.mark.asyncio
    async def test_parse_input_schema_with_no_trigger_node(self):
        """Test parsing input schema when no trigger node exists."""
        workflow_json = {
            "nodes": [
                {
                    "name": "Some Other Node",
                    "type": "n8n-nodes-base.someOtherNode",
                    "parameters": {}
                }
            ]
        }
        
        result = parse_input_schema(workflow_json)
        
        # Assertions - should return default schema
        expected_default = {
            "type": "object",
            "properties": {},
            "required": [],
            "definitions": {}
        }
        assert result == expected_default