"""
API endpoints for handling n8n webhook callbacks.
"""
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Request, Body
from pydantic import BaseModel

from api.workflow_service import handle_workflow_callback

router = APIRouter()

# Dependency to get Supabase client
def get_supabase(request: Request):
    return request.app.state.supabase

class WebhookPayload(BaseModel):
    """
    Payload sent by n8n webhook node.
    """
    output_data: Dict[str, Any]
    secret_key: str

@router.post("/webhook/callback/{run_id}", tags=["Webhooks"])
async def webhook_callback(
    run_id: str,
    payload: WebhookPayload = Body(...),
    supabase=Depends(get_supabase)
):
    """
    Receive callback from n8n workflow execution.
    
    The n8n workflow must have a Webhook node (POST) that sends:
    {
        "output_data": { ... },
        "secret_key": "..."
    }
    """
    try:
        success = await handle_workflow_callback(
            supabase,
            run_id,
            payload.output_data,
            payload.secret_key
        )
        
        if not success:
            raise HTTPException(status_code=400, detail="Failed to process callback. Invalid secret or run_id.")
            
        return {"status": "success", "message": "Callback processed"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Callback error: {str(e)}")
