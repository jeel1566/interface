from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime
import asyncio

from api.workflow_service import WorkflowExecutor

router = APIRouter()

# --- Pydantic Schemas ---

class DashboardFieldCreate(BaseModel):
    name: str
    label: str
    type: str
    required: bool = False
    default_value: Optional[str] = None
    description: Optional[str] = None
    options: Optional[List[str]] = None

class DashboardCreate(BaseModel):
    name: str
    description: Optional[str] = None
    workflow_id: str
    instance_id: str
    theme_color: str = "blue"
    fields: List[DashboardFieldCreate]

class DashboardFieldResponse(DashboardFieldCreate):
    id: int
    dashboard_id: int

class DashboardResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    workflow_id: str
    instance_id: str
    theme_color: str
    created_at: str
    fields: List[DashboardFieldResponse]

class DashboardExecuteRequest(BaseModel):
    inputs: Dict[str, Any]

# --- Dependency to get Supabase client ---

def get_supabase(request: Request):
    return request.app.state.supabase

# --- Endpoints ---

@router.post("/", response_model=DashboardResponse)
async def create_dashboard(dashboard_data: DashboardCreate, supabase=Depends(get_supabase)):
    """Create a new dashboard with fields."""
    try:
        # Insert dashboard
        dashboard_insert = {
            "name": dashboard_data.name,
            "description": dashboard_data.description,
            "workflow_id": dashboard_data.workflow_id,
            "instance_id": dashboard_data.instance_id,
            "theme_color": dashboard_data.theme_color
        }
        
        dashboard_response = await asyncio.to_thread(
            lambda: supabase.table('dashboards').insert(dashboard_insert).execute()
        )
        
        if not dashboard_response.data:
            raise HTTPException(status_code=500, detail="Failed to create dashboard")
        
        created_dashboard = dashboard_response.data[0]
        dashboard_id = created_dashboard['id']
        
        # Insert fields
        fields_to_insert = [
            {
                "dashboard_id": dashboard_id,
                "name": field.name,
                "label": field.label,
                "type": field.type,
                "required": field.required,
                "default_value": field.default_value,
                "description": field.description,
                "options": field.options
            }
            for field in dashboard_data.fields
        ]
        
        if fields_to_insert:
            await asyncio.to_thread(
                lambda: supabase.table('dashboard_fields').insert(fields_to_insert).execute()
            )
        
        # Fetch complete dashboard with fields
        complete_dashboard = await asyncio.to_thread(
            lambda: supabase.table('dashboards').select('*, dashboard_fields(*)').eq('id', dashboard_id).execute()
        )
        
        if not complete_dashboard.data:
            raise HTTPException(status_code=500, detail="Failed to fetch created dashboard")
        
        dashboard_with_fields = complete_dashboard.data[0]
        
        # Transform to match response model
        return {
            "id": dashboard_with_fields['id'],
            "name": dashboard_with_fields['name'],
            "description": dashboard_with_fields['description'],
            "workflow_id": dashboard_with_fields['workflow_id'],
            "instance_id": dashboard_with_fields['instance_id'],
            "theme_color": dashboard_with_fields['theme_color'],
            "created_at": dashboard_with_fields['created_at'],
            "fields": dashboard_with_fields.get('dashboard_fields', [])
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create dashboard: {str(e)}")

@router.get("/", response_model=List[DashboardResponse])
async def list_dashboards(supabase=Depends(get_supabase)):
    """List all dashboards with their fields."""
    try:
        response = await asyncio.to_thread(
            lambda: supabase.table('dashboards').select('*, dashboard_fields(*)').execute()
        )
        
        dashboards = []
        for dashboard in response.data:
            dashboards.append({
                "id": dashboard['id'],
                "name": dashboard['name'],
                "description": dashboard['description'],
                "workflow_id": dashboard['workflow_id'],
                "instance_id": dashboard['instance_id'],
                "theme_color": dashboard['theme_color'],
                "created_at": dashboard['created_at'],
                "fields": dashboard.get('dashboard_fields', [])
            })
        
        return dashboards
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboards: {str(e)}")

@router.get("/{dashboard_id}", response_model=DashboardResponse)
async def get_dashboard(dashboard_id: int, supabase=Depends(get_supabase)):
    """Get a specific dashboard by ID."""
    try:
        response = await asyncio.to_thread(
            lambda: supabase.table('dashboards').select('*, dashboard_fields(*)').eq('id', dashboard_id).execute()
        )
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Dashboard not found")
        
        dashboard = response.data[0]
        return {
            "id": dashboard['id'],
            "name": dashboard['name'],
            "description": dashboard['description'],
            "workflow_id": dashboard['workflow_id'],
            "instance_id": dashboard['instance_id'],
            "theme_color": dashboard['theme_color'],
            "created_at": dashboard['created_at'],
            "fields": dashboard.get('dashboard_fields', [])
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard: {str(e)}")

@router.post("/{dashboard_id}/execute")
async def execute_dashboard(
    dashboard_id: int, 
    request: DashboardExecuteRequest, 
    supabase=Depends(get_supabase)
):
    """Execute a workflow associated with a dashboard."""
    try:
        # Fetch dashboard
        dashboard_response = await asyncio.to_thread(
            lambda: supabase.table('dashboards').select('*').eq('id', dashboard_id).execute()
        )
        
        if not dashboard_response.data:
            raise HTTPException(status_code=404, detail="Dashboard not found")
        
        dashboard = dashboard_response.data[0]
        
        # Initialize WorkflowExecutor
        executor = WorkflowExecutor(supabase, None)
        
        # Queue execution
        run_id = await executor.queue_execution(
            workflow_id=dashboard['workflow_id'],
            user_id="anonymous_dashboard_user",
            input_data=request.inputs,
            instance_id=dashboard['instance_id']
        )
        
        return {
            "status": "queued",
            "run_id": run_id,
            "message": "Workflow execution started successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to execute workflow: {str(e)}")
