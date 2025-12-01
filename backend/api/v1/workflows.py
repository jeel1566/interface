"""
API endpoints for managing n8n workflows.
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Request, Query
from pydantic import BaseModel
import asyncio

router = APIRouter()


# Pydantic models
class WorkflowResponse(BaseModel):
    id: str
    name: str
    active: bool


class WorkflowDetail(BaseModel):
    id: str
    name: str
    active: bool
    nodes: List[dict]
    connections: dict
    input_schema: Optional[dict] = None
    output_schema: Optional[dict] = None


class WorkflowExecuteRequest(BaseModel):
    instance_id: str
    input_data: dict


class WorkflowExecuteResponse(BaseModel):
    run_id: str
    status: str
    message: str


# Dependency to get Supabase client
def get_supabase(request: Request):
    return request.app.state.supabase


@router.get("/workflows", response_model=List[WorkflowResponse], tags=["Workflows"])
async def list_workflows(
    instance_id: str = Query(..., description="ID of the n8n instance"),
    supabase=Depends(get_supabase)
):
    """
    List all workflows from a specific n8n instance.
    """
    try:
        # Get instance details
        instance_response = await asyncio.to_thread(
            lambda: supabase.table('instances').select('*').eq('id', instance_id).eq('is_active', True).execute()
        )
        
        if not instance_response.data:
            raise HTTPException(status_code=404, detail="Instance not found")
        
        instance = instance_response.data[0]
        
        # Connect to n8n instance
        from api.n8n_service import N8nClient
        client = N8nClient(instance['url'], instance['api_key_encrypted'])
        
        workflows = await client.get_workflows()
        
        return [
            WorkflowResponse(
                id=wf['id'],
                name=wf['name'],
                active=wf['active']
            )
            for wf in workflows
        ]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch workflows: {str(e)}")


@router.get("/workflows/{workflow_id}", response_model=WorkflowDetail, tags=["Workflows"])
async def get_workflow(
    workflow_id: str,
    instance_id: str = Query(..., description="ID of the n8n instance"),
    supabase=Depends(get_supabase)
):
    """
    Get a specific workflow with full details including input schema.
    """
    try:
        # Get instance details
        instance_response = await asyncio.to_thread(
            lambda: supabase.table('instances').select('*').eq('id', instance_id).eq('is_active', True).execute()
        )
        
        if not instance_response.data:
            raise HTTPException(status_code=404, detail="Instance not found")
        
        instance = instance_response.data[0]
        
        # Connect to n8n instance
        from api.n8n_service import N8nClient, parse_input_schema, parse_output_schema
        client = N8nClient(instance['url'], instance['api_key_encrypted'])
        
        workflow = await client.get_workflow_by_id(workflow_id)
        
        # Parse input and output schemas from workflow
        input_schema = parse_input_schema(workflow)
        output_schema = parse_output_schema(workflow)
        
        return WorkflowDetail(
            id=workflow['id'],
            name=workflow['name'],
            active=workflow['active'],
            nodes=workflow.get('nodes', []),
            connections=workflow.get('connections', {}),
            input_schema=input_schema,
            output_schema=output_schema
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch workflow: {str(e)}")


@router.post("/workflows/{workflow_id}/execute", response_model=WorkflowExecuteResponse, tags=["Workflows"])
async def execute_workflow(
    workflow_id: str,
    request_data: WorkflowExecuteRequest,
    supabase=Depends(get_supabase)
):
    """
    Execute a workflow with the provided input data.
    
    This endpoint:
    1. Validates the workflow exists
    2. Creates an execution log record
    3. Triggers the n8n workflow
    4. Returns a run_id for tracking
    """
    try:
        # Use the shared WorkflowExecutor service
        from api.workflow_service import WorkflowExecutor
        
        # Initialize executor (config is not strictly used by the class currently, so None is fine)
        executor = WorkflowExecutor(supabase, None)
        
        # Queue the execution
        # Note: We use a placeholder user_id for MVP
        run_id = await executor.queue_execution(
            workflow_id=workflow_id,
            user_id="mvp-user",
            input_data=request_data.input_data,
            instance_id=request_data.instance_id
        )
        
        return WorkflowExecuteResponse(
            run_id=run_id,
            status='pending',
            message=f'Workflow execution queued with run_id: {run_id}'
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to execute workflow: {str(e)}")

