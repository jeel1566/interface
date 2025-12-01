import asyncio
import httpx
import logging
from typing import Dict, List, Optional, Tuple, Any
from urllib.parse import urljoin, urlparse
from pydantic import BaseModel, Field
import random


# Custom exceptions
class N8nConnectionError(Exception):
    """Exception raised when there's a connection error to the n8n instance."""
    pass


class WorkflowNotFoundError(Exception):
    """Exception raised when a workflow is not found."""
    pass


# Pydantic models for type hints
class WorkflowDefinition(BaseModel):
    """Pydantic model for workflow definition."""
    id: str
    name: str
    active: bool


class TriggerNodeDefinition(BaseModel):
    """Pydantic model for trigger node definition."""
    name: str
    type: str
    parameters: Dict[str, Any] = Field(default_factory=dict)


class N8nClient:
    """
    Client for interacting with n8n API.
    
    This service handles:
    - Fetching list of workflows from user's n8n instance
    - Fetching full workflow definition by ID
    - Parsing input_schema from workflow JSON
    - Detecting trigger node (Webhook vs Manual)
    """
    
    def __init__(self, instance_url: str, api_key: str):
        """
        Initialize the N8nClient.
        
        Args:
            instance_url: The URL of the n8n instance
            api_key: The API key for authentication
            
        Raises:
            ValueError: If the instance URL is invalid or API key is empty
        """
        # Validate URLs
        parsed_url = urlparse(instance_url)
        if not parsed_url.scheme or not parsed_url.netloc:
            raise ValueError(f"Invalid instance URL: {instance_url}")
        
        if not api_key:
            raise ValueError("API key cannot be empty")
            
        # Ensure the URL ends with a slash for proper joining
        # Sanitize URL: If user pasted a page URL (e.g. .../workflow/ID or .../home/workflows), strip it back to base
        if "/workflow/" in instance_url or "/home/" in instance_url:
            parsed = urlparse(instance_url)
            instance_url = f"{parsed.scheme}://{parsed.netloc}/"
            self.logger.warning(f"Sanitized instance URL from {urlparse(instance_url).path} to base domain: {instance_url}")
        
        self.instance_url = instance_url if instance_url.endswith('/') else instance_url + '/'
        self.api_key = api_key
        self.client = httpx.AsyncClient(
            headers={
                "X-N8N-API-KEY": api_key,
                "Content-Type": "application/json"
            },
            timeout=30.0
        )
        
        # Set up logger
        self.logger = logging.getLogger(__name__)

    async def _make_request(self, method: str, endpoint: str, **kwargs) -> httpx.Response:
        """
        Make an HTTP request with retry logic and logging.
        
        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint to call
            **kwargs: Additional arguments to pass to httpx
        
        Returns:
            httpx.Response: The response from the API
        
        Raises:
            N8nConnectionError: If there's a connection error
            WorkflowNotFoundError: If the requested resource is not found
        """
        url = urljoin(self.instance_url, endpoint)
        self.logger.debug(f"Making {method} request to {url}")
        
        # Implement retry logic with exponential backoff
        max_retries = 3
        base_delay = 1  # Base delay in seconds
        
        for attempt in range(max_retries):
            try:
                response = await self.client.request(method, url, **kwargs)
                self.logger.debug(f"Response status: {response.status_code}")
                
                if response.status_code == 401:
                    raise N8nConnectionError(f"Unauthorized: Invalid API key for instance {self.instance_url}")
                elif response.status_code == 404:
                    raise WorkflowNotFoundError(f"Resource not found: {url}")
                elif response.status_code >= 400:
                    response.raise_for_status()
                
                return response
                
            except (httpx.RequestError, httpx.HTTPStatusError) as e:
                if attempt == max_retries - 1:  # Last attempt
                    if isinstance(e, httpx.HTTPStatusError) and e.response.status_code == 401:
                        raise N8nConnectionError(f"Unauthorized: Invalid API key for instance {self.instance_url}") from e
                    else:
                        raise N8nConnectionError(f"Failed to connect to n8n instance after {max_retries} attempts: {str(e)}") from e
                
                # Exponential backoff with jitter
                delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
                self.logger.warning(f"Request failed (attempt {attempt + 1}/{max_retries}): {str(e)}. Retrying in {delay:.2f}s")
                await asyncio.sleep(delay)

    async def get_workflows(self) -> List[Dict[str, Any]]:
        """
        Fetch a list of workflows from the n8n instance.
        
        Returns:
            List of workflow dictionaries with id, name, and active status
        """
        response = await self._make_request("GET", "api/v1/workflows")
        
        try:
            workflows_data = response.json()
            self.logger.info(f"Raw n8n workflows response: {workflows_data}")
        except Exception as e:
            self.logger.error(f"Failed to parse n8n response as JSON. Status: {response.status_code}, Content: {response.text[:200]}...")
            raise N8nConnectionError(f"Invalid response from n8n instance: {response.text[:100]}") from e
        
        # Return format: [{"id": "xxx", "name": "yyy", "active": true}, ...]
        workflows = []
        if "data" in workflows_data:
            # Handle different response structures
            for wf in workflows_data["data"]:
                workflows.append({
                    "id": wf.get("id", ""),
                    "name": wf.get("name", ""),
                    "active": wf.get("active", False)
                })
        else:
            # Direct array of workflows
            for wf in workflows_data:
                workflows.append({
                    "id": wf.get("id", ""),
                    "name": wf.get("name", ""),
                    "active": wf.get("active", False)
                })
        
        return workflows

    async def get_workflow_by_id(self, workflow_id: str) -> Dict[str, Any]:
        """
        Fetch a full workflow definition by its ID.
        
        Args:
            workflow_id: The ID of the workflow to fetch
        
        Returns:
            The full workflow JSON definition
        """
        response = await self._make_request("GET", f"api/v1/workflows/{workflow_id}")
        workflow_data = response.json()
        return workflow_data

    async def validate_connection(self) -> bool:
        """
        Validate the connection to the n8n instance.
        
        Returns:
            True if the connection is valid, False otherwise
        """
        try:
            # Test the connection with a simple request to get a list of workflows (limit to 1)
            response = await self._make_request("GET", "api/v1/workflows?limit=1")
            # If we get a successful response, the connection is valid
            return response.status_code == 200
        except (N8nConnectionError, WorkflowNotFoundError):
            return False
        except Exception:
            return False


def parse_input_schema(workflow_json: Dict[str, Any]) -> Dict[str, Any]:
    """
    Parse the input schema from a workflow JSON.
    
    This function detects the first trigger node (usually node at index 0)
    and extracts the node.parameters.schema if available.
    Falls back to a default schema: { "type": "object", "properties": {}, "required": [] }
    
    Args:
        workflow_json: The full workflow JSON definition
        
    Returns:
        The input schema dictionary
        
    Example output:
        {
          "type": "object",
          "properties": {
            "email_body": {"type": "string", "description": "Body of email"},
            "customer_id": {"type": "number"}
          },
          "required": ["email_body"],
          "definitions": {}
        }
    """
    # Find the trigger node - typically the first node in the workflow
    nodes = workflow_json.get("nodes", [])
    trigger_node = None
    
    # Look for trigger-type nodes
    for node in nodes:
        node_type = node.get("type", "").lower()
        if any(trigger_type in node_type for trigger_type in ["trigger", "webhook", "manual"]):
            trigger_node = node
            break
    
    # If no trigger found at the beginning, just get the first node
    if not trigger_node and nodes:
        trigger_node = nodes[0]
    
    # Extract schema if available
    if trigger_node:
        parameters = trigger_node.get("parameters", {})
        schema = parameters.get("schema")
        
        if schema:
            return schema
    
    # Fallback to default schema
    return {
        "type": "object",
        "properties": {},
        "required": [],
        "definitions": {}
    }


def parse_output_schema(workflow_json: Dict[str, Any]) -> Dict[str, Any]:
    """
    Parse the output schema from a workflow JSON.
    
    This function looks for the last node in the workflow (typically the output node)
    and extracts any schema information available. For n8n workflows, the output
    schema is often defined in the last node or can be inferred from the workflow structure.
    
    Args:
        workflow_json: The full workflow JSON definition
        
    Returns:
        The output schema dictionary
    """
    nodes = workflow_json.get("nodes", [])
    
    if not nodes:
        return {
            "type": "object",
            "properties": {},
            "required": [],
            "definitions": {}
        }
    
    # Get the last node (typically the output/final node)
    last_node = nodes[-1]
    
    # Check if there's a schema defined in parameters
    parameters = last_node.get("parameters", {})
    schema = parameters.get("output_schema") or parameters.get("schema")
    
    if schema:
        return schema
    
    # Fallback: return default schema
    return {
        "type": "object",
        "properties": {},
        "required": [],
        "definitions": {}
    }


def detect_trigger_type(workflow_json: Dict[str, Any]) -> Tuple[str, Dict[str, Any]]:
    """
    Detect the trigger type of a workflow.
    
    This function finds the first trigger node and returns its type and definition.
    
    Args:
        workflow_json: The full workflow JSON definition
        
    Returns:
        A tuple containing (trigger_type, node_definition)
        trigger_type ∈ ['webhook', 'manual', 'trigger', 'unknown']
    """
    nodes = workflow_json.get("nodes", [])
    
    for node in nodes:
        node_type = node.get("type", "").lower()
        
        # Handle various n8n node naming conventions
        if "webhook" in node_type:
            return "webhook", node
        elif "manual" in node_type or "execute" in node_type:
            return "manual", node
        elif "trigger" in node_type:
            return "trigger", node
    
    # If no specific trigger found, return unknown
    # Use the first node as the default if it exists
    if nodes:
        return "unknown", nodes[0]
    
    # Return empty default if no nodes
    return "unknown", {}