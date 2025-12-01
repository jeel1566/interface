"""
Service for async workflow execution.

This service handles:
1. Queues workflows to Celery
2. Generates webhook URLs
3. Handles callbacks from n8n

Key Architecture:
- Execution is async: Request → Immediate response (run_id) → Later callback
- Workflow must have HTTP Request node at end that POSTs to callback URL
"""

import asyncio
import logging
import uuid
from datetime import datetime
from typing import Dict, Any, Optional
from urllib.parse import urljoin

import httpx
from pydantic import BaseModel, Field

from api.n8n_service import N8nClient


# Pydantic models for type hints
class ExecutionLogCreate(BaseModel):
    """Pydantic model for creating execution logs."""
    run_id: str = Field(..., description="Unique identifier for the execution run")
    user_id: str = Field(..., description="ID of the user executing the workflow")
    workflow_id: str = Field(..., description="ID of the workflow being executed")
    instance_id: str = Field(..., description="ID of the n8n instance")
    status: str = Field(default="pending", description="Current status of execution")
    input_data: Dict[str, Any] = Field(default_factory=dict, description="Input data for the workflow")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="When the execution was created")


class CallbackPayload(BaseModel):
    """Pydantic model for callback payload from n8n."""
    run_id: str = Field(..., description="Unique identifier for the execution run")
    output_data: Dict[str, Any] = Field(default_factory=dict, description="Output data from workflow execution")
    secret_key: str = Field(..., description="Secret key for authentication")


class WorkflowExecutor:
    """
    Service class for executing workflows asynchronously.
    
    This class handles queuing workflows to Celery and managing the execution lifecycle.
    """
    
    def __init__(self, supabase_client, config):
        """
        Initialize the WorkflowExecutor.
        
        Args:
            supabase_client: Client for interacting with Supabase
            config: Configuration object containing backend URL and other settings
        """
        self.supabase = supabase_client
        self.config = config
        self.logger = logging.getLogger(__name__)
    
    async def queue_execution(
        self,
        workflow_id: str,
        user_id: str,
        input_data: Dict[str, Any],
        instance_id: str
    ) -> str:
        """
        Queue a workflow execution and return a run_id immediately.
        
        Args:
            workflow_id: ID of the workflow to execute
            user_id: ID of the user requesting execution (for SaaS phase)
            input_data: Input data to pass to the workflow
            instance_id: ID of the n8n instance to use
            
        Returns:
            str: Unique run_id for tracking the execution
            
        Raises:
            ValueError: If input_data is invalid
        """
        # Validate input_data is not empty
        if not input_data or not isinstance(input_data, dict):
            raise ValueError("input_data must be a non-empty dictionary")
        
        # Generate unique run_id
        run_id = str(uuid.uuid4())
        
        # Insert row in execution_logs: { run_id, status: 'pending', input_data }
        execution_log = ExecutionLogCreate(
            run_id=run_id,
            user_id=user_id,
            workflow_id=workflow_id,
            instance_id=instance_id,
            status='pending',
            input_data=input_data
        )
        
        # Assuming Supabase table name is 'execution_logs'
        # Insert execution log into Supabase
        await self._insert_execution_log(execution_log)
        
        # Get user's n8n instance URL/API key from Supabase
        instance_details = await self._get_instance_details(instance_id)
        if not instance_details:
            raise ValueError(f"Instance with ID {instance_id} not found")
        
        instance_url = instance_details.get("url")
        api_key = instance_details.get("api_key")
        
        if not instance_url or not api_key:
            raise ValueError("Missing instance URL or API key")
        
        # Get workflow's webhook_url (or generate if missing)
        webhook_url = await self._get_or_generate_webhook_url(run_id)
        
        # Queue Celery task: execute_workflow_task(run_id, webhook_url, input_data)
        # For MVP, we'll call it directly instead of queueing
        # We need to pass workflow_id to find the webhook path
        asyncio.create_task(execute_workflow_task(
            self.supabase,
            run_id,
            webhook_url,
            input_data,
            instance_url,
            api_key,
            workflow_id
        ))
        self.logger.info(f"Started async workflow execution for run_id: {run_id}")
        
        # Return run_id immediately
        return run_id
    
    async def _insert_execution_log(self, execution_log: ExecutionLogCreate) -> None:
        """
        Insert execution log into Supabase.
        
        Args:
            execution_log: Execution log data to insert
        """
        try:
            # Supabase-py v2 is synchronous, wrap in asyncio.to_thread
            await asyncio.to_thread(
                self.supabase.table('execution_logs').insert(execution_log.dict()).execute
            )
        except Exception as e:
            self.logger.error(f"Failed to insert execution log: {str(e)}")
            raise
    
    async def _get_instance_details(self, instance_id: str) -> Optional[Dict[str, Any]]:
        """
        Get n8n instance details from Supabase.
        
        Args:
            instance_id: ID of the instance to retrieve
            
        Returns:
            Dict with instance details or None if not found
        """
        try:
            response = await asyncio.to_thread(
                lambda: self.supabase.table('instances').select('*').eq('id', instance_id).execute()
            )
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            self.logger.error(f"Failed to get instance details: {str(e)}")
            raise
    
    async def _get_or_generate_webhook_url(self, run_id: str) -> str:
        """
        Get existing webhook URL for this run or generate a new one.
        
        Args:
            run_id: ID of the execution run
            
        Returns:
            str: The webhook URL for this execution
        """
        # Generate webhook URL
        webhook_url = generate_webhook_url(run_id)
        
        # In a real implementation, you might want to store this URL in a database
        # so you can track the relationship between run_id and webhook_url
        # For this example, we just generate it on-demand
        
        return webhook_url


def generate_webhook_url(run_id: str) -> str:
    """
    Generate a webhook URL for a specific execution run.
    
    Args:
        run_id: The unique identifier for the execution run
        
    Returns:
        str: The full webhook URL in format https://your-backend.com/v1/webhook/callback/{run_id}
    """
    from config import settings
    base_url = settings.BACKEND_URL or "http://localhost:8000"
    
    # Format: https://your-backend.com/v1/webhook/callback/{run_id}
    webhook_path = f"/api/v1/webhook/callback/{run_id}"
    webhook_url = urljoin(base_url, webhook_path)
    
    return webhook_url


async def execute_workflow_task(
    supabase_client,
    run_id: str, 
    webhook_url: str, 
    input_data: Dict[str, Any], 
    instance_url: str, 
    api_key: str,
    workflow_id: str
) -> None:
    """
    Celery task to execute the workflow.
    
    This function:
    - Updates execution_logs: status = 'running'
    - Fetches n8n instance URL + API key from Supabase Vault
    - POSTs input_data to n8n webhook_url
    - Handles exceptions, updates status to 'failed'
    - Sets timeout: 15 minutes per execution
    
    Args:
        supabase_client: Supabase client instance
        run_id: The unique identifier for the execution run
        webhook_url: The webhook URL to call
        input_data: Input data to send to the workflow
        instance_url: URL of the n8n instance
        api_key: API key for the n8n instance
    """
    
    # Update execution_logs: status = 'running'
    try:
        await asyncio.to_thread(
            lambda: supabase_client.table('execution_logs')
            .update({'status': 'running', 'started_at': datetime.utcnow().isoformat()})
            .eq('run_id', run_id)
            .execute()
        )
    except Exception as e:
        logging.error(f"Failed to update execution status to 'running': {str(e)}")
        return  # Exit if we can't update status - continuing would be inconsistent
    
    # Create n8n client
    n8n_client = N8nClient(instance_url, api_key)
    
    # Set timeout to 15 minutes (900 seconds)
    timeout = httpx.Timeout(900.0)  # 15 minutes
    
    try:
            # Fetch workflow to find webhook path
            workflow = await n8n_client.get_workflow_by_id(workflow_id)
            nodes = workflow.get("nodes", [])
            webhook_node = next((n for n in nodes if "webhook" in n.get("type", "").lower()), None)
            
            if not webhook_node:
                raise Exception("No Webhook node found in workflow")
                
            # Extract path and method
            params = webhook_node.get("parameters", {})
            path = params.get("path", "")
            method = params.get("httpMethod", "POST")
            
            if not path:
                raise Exception("Webhook node has no path configured")
                
            # Construct n8n webhook URL
            # n8n webhook URLs are typically /webhook/{path}
            # Ensure instance_url ends with /
            base_url = instance_url.rstrip("/")
            n8n_webhook_url = f"{base_url}/webhook/{path}"
            
            logging.info(f"Triggering n8n webhook: {n8n_webhook_url}")
            
            # Prepare payload: input_data + _callback_url
            payload = {
                **input_data,
                "_callback_url": webhook_url,
                "_run_id": run_id
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.request(method, n8n_webhook_url, json=payload)
                response.raise_for_status()
            
            logging.info(f"Successfully triggered workflow for run_id: {run_id}")
            
    except httpx.TimeoutException:
        logging.error(f"Workflow execution timed out for run_id: {run_id}")
        # Update execution_logs: status = 'failed' with timeout message
        try:
            await asyncio.to_thread(
                lambda: supabase_client.table('execution_logs')
                .update({
                    'status': 'failed', 
                    'error_message': 'Execution timed out after 15 minutes',
                    'completed_at': datetime.utcnow().isoformat()
                })
                .eq('run_id', run_id)
                .execute()
            )
        except Exception as e:
            logging.error(f"Failed to update execution status after timeout: {str(e)}")
    except Exception as e:
        logging.error(f"Failed to execute workflow for run_id {run_id}: {str(e)}")
        # Update execution_logs: status = 'failed' with error message
        try:
            await asyncio.to_thread(
                lambda: supabase_client.table('execution_logs')
                .update({
                    'status': 'failed', 
                    'error_message': str(e),
                    'completed_at': datetime.utcnow().isoformat()
                })
                .eq('run_id', run_id)
                .execute()
            )
        except Exception as update_error:
            logging.error(f"Failed to update execution status after error: {str(update_error)}")


async def handle_workflow_callback(
    supabase_client,
    run_id: str, 
    output_data: Dict[str, Any], 
    secret_key: str
) -> bool:
    """
    Handle callback from n8n workflow execution.
    
    This function:
    - Validates secret_key matches (stored in env var)
    - Finds execution_logs row by run_id
    - Updates: { status: 'success', output_data, completed_at }
    - Can trigger Supabase Realtime event (optional, for WebSocket push)
    
    Args:
        supabase_client: Supabase client instance
        run_id: The unique identifier for the execution run
        output_data: Output data from the workflow execution
        secret_key: Secret key for authentication
        
    Returns:
        bool: True if callback was handled successfully, False otherwise
    """
    import os
    from config import settings
    
    # Validate secret_key matches (stored in env var)
    expected_secret = settings.WORKFLOW_CALLBACK_SECRET_KEY
    if not expected_secret or secret_key != expected_secret:
        logging.warning(f"Invalid secret key for callback with run_id: {run_id}")
        return False
    
    try:
        # Find execution_logs row by run_id
        response = await asyncio.to_thread(
            lambda: supabase_client.table('execution_logs').select('*').eq('run_id', run_id).execute()
        )
        
        if not response.data:
            logging.warning(f"Execution log not found for run_id: {run_id}")
            return False
        
        # Update: { status: 'success', output_data, completed_at }
        await asyncio.to_thread(
            lambda: supabase_client.table('execution_logs')
            .update({
                'status': 'success',
                'output_data': output_data,
                'completed_at': datetime.utcnow().isoformat()
            })
            .eq('run_id', run_id)
            .execute()
        )
        
        logging.info(f"Successfully updated execution log for run_id: {run_id}")
        
        # Optional: Trigger Supabase Realtime event (for WebSocket push)
        # This would involve sending a realtime update through Supabase
        # await trigger_supabase_realtime_event(run_id, output_data)
        
        return True
        
    except Exception as e:
        logging.error(f"Failed to handle callback for run_id {run_id}: {str(e)}")
        return False