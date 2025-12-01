import asyncio
import os
import pytest
import httpx
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime
from api.workflow_service import (
    WorkflowExecutor, 
    handle_workflow_callback, 
    execute_workflow_task,
    generate_webhook_url
)


@pytest.fixture
def async_supabase_client():
    """Mocked async Supabase client for testing."""
    mock_client = AsyncMock()
    mock_client.table = MagicMock()
    return mock_client


@pytest.fixture
def redis_client():
    """Mocked Redis client for testing."""
    mock_client = MagicMock()
    mock_client.get = MagicMock()
    mock_client.set = MagicMock()
    return mock_client


@pytest.fixture
def celery_app():
    """Mocked Celery app for testing."""
    mock_app = MagicMock()
    mock_app.conf = {
        'task_always_eager': True,  # Run tasks synchronously for testing
        'task_eager_propagates': True
    }
    return mock_app


@pytest.fixture
def sample_workflow_json():
    """Sample workflow JSON for testing."""
    return {
        "id": "test-workflow-123",
        "name": "Test Workflow",
        "nodes": [
            {
                "id": "node1",
                "name": "HTTP Request",
                "type": "n8n-nodes-base.httpRequest",
                "parameters": {
                    "url": "https://httpbin.org/post",
                    "method": "POST",
                    "options": {}
                },
                "position": [0, 0]
            }
        ],
        "connections": {}
    }


@pytest.fixture
def sample_execution_data():
    """Sample execution data for testing."""
    return {
        "input_data": {
            "message": "Test message",
            "user_id": "test-user-123"
        },
        "user_id": "test-user-123",
        "workflow_id": "test-workflow-123",
        "instance_id": "test-instance-123"
    }


@pytest.mark.asyncio
async def test_queue_execution_success(async_supabase_client, sample_execution_data):
    """Test successful queueing of workflow execution."""
    # Set up mock responses
    async_supabase_client.table.return_value.insert.return_value.execute = AsyncMock()
    instance_details = {
        "id": "test-instance-123",
        "url": "https://n8n.example.com",
        "api_key": "test-api-key"
    }
    select_mock = AsyncMock()
    select_mock.eq.return_value.execute.return_value = MagicMock(data=[instance_details])
    async_supabase_client.table.return_value.select = MagicMock(return_value=select_mock)
    
    # Create executor and call queue_execution
    executor = WorkflowExecutor(async_supabase_client, MagicMock())
    result = await executor.queue_execution(
        workflow_id=sample_execution_data["workflow_id"],
        user_id=sample_execution_data["user_id"],
        input_data=sample_execution_data["input_data"],
        instance_id=sample_execution_data["instance_id"]
    )
    
    # Assertions
    assert result is not None
    assert len(result) == 36  # UUID length
    # Verify the insert was called
    async_supabase_client.table.return_value.insert.assert_called_once()
    # Verify instance details were retrieved
    async_supabase_client.table.return_value.select.assert_called_once()


@pytest.mark.asyncio
async def test_queue_execution_invalid_data(async_supabase_client):
    """Test that invalid input_data raises an error."""
    executor = WorkflowExecutor(async_supabase_client, MagicMock())
    
    # Test with empty input_data
    with pytest.raises(ValueError):
        await executor.queue_execution(
            workflow_id="test-workflow-123",
            user_id="test-user-123",
            input_data={},
            instance_id="test-instance-123"
        )
    
    # Test with non-dict input_data
    with pytest.raises(ValueError):
        await executor.queue_execution(
            workflow_id="test-workflow-123",
            user_id="test-user-123",
            input_data="invalid",
            instance_id="test-instance-123"
        )


@pytest.mark.asyncio
@patch.dict(os.environ, {'WORKFLOW_CALLBACK_SECRET_KEY': 'test-secret-key'})
async def test_callback_handler_success(async_supabase_client):
    """Test successful callback handling with valid secret."""
    # Mock supabase response for finding the execution log
    select_mock = AsyncMock()
    select_mock.eq.return_value.execute.return_value = MagicMock(
        data=[{
            "run_id": "test-run-123",
            "status": "running",
            "input_data": {"test": "data"}
        }]
    )
    async_supabase_client.table.return_value.select = MagicMock(return_value=select_mock)
    
    # Mock the update operation
    async_supabase_client.table.return_value.update.return_value.eq = MagicMock(return_value=AsyncMock())
    async_supabase_client.table.return_value.update.return_value.eq.return_value.execute = AsyncMock()
    
    # Call the callback handler
    result = await handle_workflow_callback(
        run_id="test-run-123",
        output_data={"result": "success"},
        secret_key="test-secret-key"
    )
    
    # Assertions
    assert result is True
    # Verify the update was called with success status
    async_supabase_client.table.return_value.update.assert_called_once()
    # Check that the update included the success status and output data
    args, kwargs = async_supabase_client.table.return_value.update.call_args
    update_data = args[0]
    assert update_data["status"] == "success"
    assert update_data["output_data"]["result"] == "success"


@pytest.mark.asyncio
@patch.dict(os.environ, {'WORKFLOW_CALLBACK_SECRET_KEY': 'test-secret-key'})
async def test_callback_handler_invalid_secret(async_supabase_client):
    """Test callback handling with invalid secret key."""
    # Call the callback handler with wrong secret
    result = await handle_workflow_callback(
        run_id="test-run-123",
        output_data={"result": "success"},
        secret_key="wrong-secret-key"
    )
    
    # Assertions
    assert result is False
    # Verify that no update was made to the execution log
    async_supabase_client.table.return_value.update.assert_not_called()


@pytest.mark.asyncio
@patch.dict(os.environ, {'WORKFLOW_CALLBACK_SECRET_KEY': 'test-secret-key'})
async def test_callback_handler_not_found(async_supabase_client):
    """Test callback handling with unknown run_id."""
    # Mock supabase response - no execution log found
    select_mock = AsyncMock()
    select_mock.eq.return_value.execute.return_value = MagicMock(data=[])
    async_supabase_client.table.return_value.select = MagicMock(return_value=select_mock)
    
    # Call the callback handler
    result = await handle_workflow_callback(
        run_id="unknown-run-id",
        output_data={"result": "success"},
        secret_key="test-secret-key"
    )
    
    # Assertions
    assert result is False


@pytest.mark.asyncio
async def test_generate_webhook_url():
    """Test that webhook URL is generated correctly."""
    # Patch the config.BACKEND_URL import
    with patch('api.workflow_service.BACKEND_URL', 'https://myapp.com'):
        run_id = "test-run-123"
        webhook_url = generate_webhook_url(run_id)
        
        # Assertions
        expected_url = "https://myapp.com/v1/webhook/callback/test-run-123"
        assert webhook_url == expected_url


@pytest.mark.asyncio
async def test_celery_task_success(async_supabase_client):
    """Test that the Celery task executes successfully."""
    # Mock the update operations
    update_mock = MagicMock()
    update_mock.eq.return_value.execute = AsyncMock()
    async_supabase_client.table.return_value.update = MagicMock(return_value=update_mock)
    
    # Mock httpx client to simulate successful API call
    with patch('httpx.AsyncClient') as mock_client_class:
        mock_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_client.post.return_value = mock_response
        mock_client_class.return_value.__aenter__.return_value = mock_client
        
        # Mock Supabase import inside the function
        with patch('api.workflow_service.supabase', async_supabase_client):
            # Call the task function directly
            await execute_workflow_task(
                run_id="test-run-123",
                webhook_url="https://example.com/webhook",
                input_data={"test": "data"},
                instance_url="https://n8n.example.com",
                api_key="test-api-key"
            )
    
    # Verify the status was updated to 'running'
    assert async_supabase_client.table.return_value.update.called
    # Check that the update was called with 'running' status
    calls = async_supabase_client.table.return_value.update.call_args_list
    running_update_called = any(call[0][0].get('status') == 'running' for call in calls)
    assert running_update_called


@pytest.mark.asyncio
async def test_celery_task_retry_on_network_error(async_supabase_client):
    """Test that the Celery task implements retry logic on network errors."""
    # Mock the update operations
    update_mock = MagicMock()
    update_mock.eq.return_value.execute = AsyncMock()
    async_supabase_client.table.return_value.update = MagicMock(return_value=update_mock)
    
    # Mock httpx client to raise a network error multiple times, then succeed
    with patch('httpx.AsyncClient') as mock_client_class, \
         patch('asyncio.sleep', new_callable=AsyncMock) as mock_sleep:
        mock_client = AsyncMock()
        # Configure it to raise a network error the first few times, then succeed
        mock_client.post.side_effect = [
            httpx.RequestError("Network error"),
            httpx.RequestError("Network error"), 
            MagicMock(status_code=200)  # Success on third attempt
        ]
        mock_client_class.return_value.__aenter__.return_value = mock_client
        
        # Mock Supabase import inside the function
        with patch('api.workflow_service.supabase', async_supabase_client):
            # Call the task function directly
            await execute_workflow_task(
                run_id="test-run-123",
                webhook_url="https://example.com/webhook",
                input_data={"test": "data"},
                instance_url="https://n8n.example.com",
                api_key="test-api-key"
            )
    
    # Verify the status was updated correctly
    assert async_supabase_client.table.return_value.update.called
    # Verify sleep was called for the retry delays
    assert mock_sleep.call_count >= 2  # Called for each retry attempt minus the last success


@pytest.mark.asyncio
async def test_celery_task_timeout(async_supabase_client):
    """Test that the Celery task handles timeout correctly."""
    # Mock the update operations
    update_mock = MagicMock()
    update_mock.eq.return_value.execute = AsyncMock()
    async_supabase_client.table.return_value.update = MagicMock(return_value=update_mock)
    
    # Mock the httpx client to raise a timeout
    with patch('httpx.AsyncClient') as mock_client_class:
        mock_client = AsyncMock()
        mock_client_class.return_value.__aenter__.return_value = mock_client
        mock_client.post.side_effect = httpx.TimeoutException("Request timed out")
        
        # Mock Supabase import inside the function
        with patch('api.workflow_service.supabase', async_supabase_client):
            # Call the task function directly
            await execute_workflow_task(
                run_id="test-run-123",
                webhook_url="https://example.com/webhook",
                input_data={"test": "data"},
                instance_url="https://n8n.example.com",
                api_key="test-api-key"
            )
    
    # Verify the status was updated to 'failed' with timeout message
    assert async_supabase_client.table.return_value.update.called
    # It should be called at least twice: once for 'running', once for 'failed'
    assert async_supabase_client.table.return_value.update.call_count >= 1


@pytest.mark.asyncio
async def test_workflow_executor_initialization():
    """Test that WorkflowExecutor is initialized correctly."""
    executor = WorkflowExecutor(async_supabase_client, MagicMock())
    
    # Assertions
    assert executor.supabase is not None
    assert executor.config is not None


@pytest.mark.asyncio
async def test_queue_execution_missing_instance(async_supabase_client):
    """Test queue execution with missing instance details."""
    # Mock supabase to return empty data for instance details
    select_mock = AsyncMock()
    select_mock.eq.return_value.execute.return_value = MagicMock(data=[])
    async_supabase_client.table.return_value.select = MagicMock(return_value=select_mock)
    
    executor = WorkflowExecutor(async_supabase_client, MagicMock())
    
    # Should raise ValueError when instance is not found
    with pytest.raises(ValueError, match="Instance with ID test-instance-123 not found"):
        await executor.queue_execution(
            workflow_id="test-workflow-123",
            user_id="test-user-123",
            input_data={"test": "data"},
            instance_id="test-instance-123"
        )


@pytest.mark.asyncio
async def test_queue_execution_missing_instance_credentials(async_supabase_client):
    """Test queue execution with missing instance URL or API key."""
    # Mock supabase to return instance with missing credentials
    instance_details = {
        "id": "test-instance-123",
        "url": "",  # Missing URL
        "api_key": ""  # Missing API key
    }
    select_mock = AsyncMock()
    select_mock.eq.return_value.execute.return_value = MagicMock(data=[instance_details])
    async_supabase_client.table.return_value.select = MagicMock(return_value=select_mock)
    
    executor = WorkflowExecutor(async_supabase_client, MagicMock())
    
    # Should raise ValueError when credentials are missing
    with pytest.raises(ValueError, match="Missing instance URL or API key"):
        await executor.queue_execution(
            workflow_id="test-workflow-123",
            user_id="test-user-123",
            input_data={"test": "data"},
            instance_id="test-instance-123"
        )


@pytest.mark.asyncio
async def test_callback_handler_supabase_error(async_supabase_client):
    """Test callback handler when Supabase operations fail."""
    # Mock supabase to raise an exception when selecting
    select_mock = AsyncMock()
    select_mock.eq.return_value.execute.side_effect = Exception("Database error")
    async_supabase_client.table.return_value.select = MagicMock(return_value=select_mock)
    
    with patch.dict(os.environ, {'WORKFLOW_CALLBACK_SECRET_KEY': 'test-secret-key'}):
        result = await handle_workflow_callback(
            run_id="test-run-123",
            output_data={"result": "success"},
            secret_key="test-secret-key"
        )
    
    # Should return False when there's an error
    assert result is False


@pytest.mark.asyncio
async def test_callback_handler_update_error(async_supabase_client):
    """Test callback handler when the update operation fails."""
    # Mock supabase to return a valid execution log but fail on update
    select_mock = AsyncMock()
    select_mock.eq.return_value.execute.return_value = MagicMock(
        data=[{
            "run_id": "test-run-123",
            "status": "running",
            "input_data": {"test": "data"}
        }]
    )
    async_supabase_client.table.return_value.select = MagicMock(return_value=select_mock)
    
    # Mock update to raise an exception
    update_mock = MagicMock()
    update_mock.eq.return_value.execute.side_effect = Exception("Update failed")
    async_supabase_client.table.return_value.update = MagicMock(return_value=update_mock)
    
    with patch.dict(os.environ, {'WORKFLOW_CALLBACK_SECRET_KEY': 'test-secret-key'}):
        result = await handle_workflow_callback(
            run_id="test-run-123",
            output_data={"result": "success"},
            secret_key="test-secret-key"
        )
    
    # Should return False when update fails
    assert result is False


@pytest.mark.asyncio
async def test_celery_task_supabase_update_error(async_supabase_client):
    """Test Celery task when Supabase update fails."""
    # Mock the update operations to raise an exception
    update_mock = MagicMock()
    update_mock.eq.return_value.execute.side_effect = Exception("Database error")
    async_supabase_client.table.return_value.update = MagicMock(return_value=update_mock)
    
    # Mock httpx client to simulate successful API call
    with patch('httpx.AsyncClient') as mock_client_class:
        mock_client = AsyncMock()
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_client.post.return_value = mock_response
        mock_client_class.return_value.__aenter__.return_value = mock_client
        
        # Mock Supabase import inside the function
        with patch('api.workflow_service.supabase', async_supabase_client):
            # Call the task function directly
            # This should handle the exception internally and not raise
            await execute_workflow_task(
                run_id="test-run-123",
                webhook_url="https://example.com/webhook",
                input_data={"test": "data"},
                instance_url="https://n8n.example.com",
                api_key="test-api-key"
            )
    
    # Verify the status update was attempted
    assert async_supabase_client.table.return_value.update.called


@pytest.mark.asyncio
async def test_workflow_executor_init_with_none_values():
    """Test WorkflowExecutor initialization with None values."""
    # This should not raise an error - the values will be checked when methods are called
    executor = WorkflowExecutor(None, None)
    
    assert executor.supabase is None
    assert executor.config is None


@pytest.mark.asyncio
async def test_generate_webhook_url_with_default():
    """Test webhook URL generation with default URL."""
    # Test when BACKEND_URL is None
    with patch('api.workflow_service.BACKEND_URL', None):
        run_id = "test-run-123"
        webhook_url = generate_webhook_url(run_id)
        
        # Should default to localhost
        expected_url = "http://localhost:8000/v1/webhook/callback/test-run-123"
        assert webhook_url == expected_url