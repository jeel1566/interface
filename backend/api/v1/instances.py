"""
API endpoints for managing n8n instances.
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, HttpUrl
import asyncio

router = APIRouter()


# Pydantic models
class InstanceCreate(BaseModel):
    name: str
    url: HttpUrl
    api_key: str  # Will be encrypted in production with Vault
    

class InstanceUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[HttpUrl] = None
    api_key: Optional[str] = None
    is_active: Optional[bool] = None


class InstanceResponse(BaseModel):
    id: str
    name: str
    url: str
    is_active: bool
    created_at: str
    updated_at: str


# Dependency to get Supabase client
def get_supabase(request: Request):
    return request.app.state.supabase


@router.get("/instances", response_model=List[InstanceResponse], tags=["Instances"])
async def list_instances(supabase=Depends(get_supabase)):
    """
    List all connected n8n instances.
    """
    import logging
    logger = logging.getLogger("uvicorn.error")
    
    try:
        logger.info("Fetching instances from database...")
        response = await asyncio.to_thread(
            lambda: supabase.table('instances').select('*').eq('is_active', True).order('created_at', desc=True).execute()
        )
        
        logger.info(f"Response data: {response.data}")
        
        return [
            InstanceResponse(
                id=str(instance['id']),
                name=instance['name'],
                url=instance['url'],
                is_active=instance['is_active'],
                created_at=instance['created_at'],
                updated_at=instance['updated_at']
            )
            for instance in response.data
        ]
    except Exception as e:
        logger.error(f"Error fetching instances: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch instances: {str(e)}")


@router.post("/instances", response_model=InstanceResponse, tags=["Instances"], status_code=201)
async def create_instance(instance: InstanceCreate, supabase=Depends(get_supabase)):
    """
    Create a new n8n instance connection.
    """
    try:
        # Validate connection to n8n instance
        from api.n8n_service import N8nClient
        
        client = N8nClient(str(instance.url), instance.api_key)
        try:
            is_valid = await client.validate_connection()
            if not is_valid:
                raise HTTPException(
                    status_code=400, 
                    detail="Failed to connect to n8n instance. Please check your URL and API Key."
                )
        except Exception as e:
            # Pass through the specific error message from the client (e.g. Unauthorized)
            raise HTTPException(status_code=400, detail=str(e))
        
        # Insert into database
        data = {
            'name': instance.name,
            'url': str(instance.url),
            'api_key_encrypted': instance.api_key,  # TODO: Encrypt with Vault
            'is_active': True
        }
        
        response = await asyncio.to_thread(
            lambda: supabase.table('instances').insert(data).execute()
        )
        
        created = response.data[0]
        return InstanceResponse(
            id=str(created['id']),
            name=created['name'],
            url=created['url'],
            is_active=created['is_active'],
            created_at=created['created_at'],
            updated_at=created['updated_at']
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create instance: {str(e)}")


@router.get("/instances/{instance_id}", response_model=InstanceResponse, tags=["Instances"])
async def get_instance(instance_id: str, supabase=Depends(get_supabase)):
    """
    Get a specific n8n instance by ID.
    """
    try:
        response = await asyncio.to_thread(
            lambda: supabase.table('instances').select('*').eq('id', instance_id).execute()
        )
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Instance not found")
        
        instance = response.data[0]
        return InstanceResponse(
            id=str(instance['id']),
            name=instance['name'],
            url=instance['url'],
            is_active=instance['is_active'],
            created_at=instance['created_at'],
            updated_at=instance['updated_at']
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch instance: {str(e)}")


@router.delete("/instances/{instance_id}", tags=["Instances"], status_code=204)
async def delete_instance(instance_id: str, supabase=Depends(get_supabase)):
    """
    Delete an n8n instance (soft delete by setting is_active=false).
    """
    try:
        response = await asyncio.to_thread(
            lambda: supabase.table('instances').update({'is_active': False}).eq('id', instance_id).execute()
        )
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Instance not found")
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete instance: {str(e)}")

