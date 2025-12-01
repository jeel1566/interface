"""
API endpoints for managing n8n workflow executions.
"""
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Request, Query
from pydantic import BaseModel
import asyncio
from datetime import datetime

router = APIRouter()


# Pydantic models
class ExecutionResponse(BaseModel):
    run_id: str
    workflow_id: str
    workflow_name: Optional[str]
    status: str
    input_data: Optional[Dict[str, Any]] = None
    output_data: Optional[Dict[str, Any]] = None
    input_schema: Optional[Dict[str, Any]] = None
    output_schema: Optional[Dict[str, Any]] = None
    created_at: str
    started_at: Optional[str]
    completed_at: Optional[str]
    error_message: Optional[str] = None


class ExecutionCreate(BaseModel):
    workflow_id: str
    instance_id: str
    input_data: Dict[str, Any]


class ExecutionStartResponse(BaseModel):
    run_id: str
    status: str
    message: str


# Dependency to get Supabase client
def get_supabase(request: Request):
    return request.app.state.supabase


@router.get("/executions", response_model=List[ExecutionResponse], tags=["Executions"])
async def list_executions(
    workflow_id: Optional[str] = Query(None, description="Filter by workflow ID"),
    instance_id: Optional[str] = Query(None, description="Filter by instance ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    start_date: Optional[datetime] = Query(None, description="Filter by start date (ISO format)"),
    end_date: Optional[datetime] = Query(None, description="Filter by end date (ISO format)"),
    limit: int = Query(50, le=100, description="Max results to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    supabase=Depends(get_supabase)
):
    """
    List all workflow executions with optional filtering.
    """
    try:
        query = supabase.table('execution_logs').select('*', count='exact')
        
        if workflow_id:
            query = query.eq('workflow_id', workflow_id)
        if instance_id:
            query = query.eq('instance_id', instance_id)
        if status:
            query = query.eq('status', status)
        if start_date:
            query = query.gte('created_at', start_date.isoformat())
        if end_date:
            query = query.lte('created_at', end_date.isoformat())
        
        query = query.order('created_at', desc=True).range(offset, offset + limit - 1)
        
        response = await asyncio.to_thread(lambda: query.execute())
        
        return [
            ExecutionResponse(
                run_id=str(execution['run_id']),
                workflow_id=execution['workflow_id'],
                workflow_name=execution.get('workflow_name'),
                status=execution['status'],
                created_at=execution['created_at'],
                started_at=execution.get('started_at'),
                completed_at=execution.get('completed_at'),
                error_message=execution.get('error_message'),
                input_data=execution.get('input_data'),
                output_data=execution.get('output_data'),
                input_schema=execution.get('input_schema'),
                output_schema=execution.get('output_schema')
            )
            for execution in response.data
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch executions: {str(e)}")


@router.get("/executions/{run_id}", response_model=ExecutionResponse, tags=["Executions"])
async def get_execution(run_id: str, supabase=Depends(get_supabase)):
    """
    Get a specific execution by run_id.
    """
    try:
        response = await asyncio.to_thread(
            lambda: supabase.table('execution_logs').select('*').eq('run_id', run_id).execute()
        )
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Execution not found")
        
        execution = response.data[0]
        return ExecutionResponse(
            run_id=str(execution['run_id']),
            workflow_id=execution['workflow_id'],
            workflow_name=execution.get('workflow_name'),
            status=execution['status'],
            created_at=execution['created_at'],
            started_at=execution.get('started_at'),
            completed_at=execution.get('completed_at'),
            error_message=execution.get('error_message'),
            input_data=execution.get('input_data'),
            output_data=execution.get('output_data'),
            input_schema=execution.get('input_schema'),
            output_schema=execution.get('output_schema')
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch execution: {str(e)}")


@router.post("/executions", response_model=ExecutionStartResponse, tags=["Executions"], status_code=202)
async def create_execution(
    execution: ExecutionCreate,
    supabase=Depends(get_supabase)
):
    """
    Start a new workflow execution.
    Returns immediately with run_id. Use GET /executions/{run_id} to check status.
    """
    try:
        # Get workflow details to get name
        from api.workflow_service import WorkflowExecutor
        
        executor = WorkflowExecutor(supabase, None)
        
        run_id = await executor.queue_execution(
            workflow_id=execution.workflow_id,
            user_id="mvp-user",  # Placeholder for MVP
            input_data=execution.input_data,
            instance_id=execution.instance_id
        )
        
        return ExecutionStartResponse(
            run_id=run_id,
            status="pending",
            message="Workflow execution queued successfully"
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start execution: {str(e)}")

