"""
Main API router for the application.

This module aggregates all versioned API routers.
"""
from fastapi import APIRouter

from .v1 import instances, workflows, executions, webhooks

api_router = APIRouter()

# Create a router for API version 1
v1_router = APIRouter()
v1_router.include_router(instances.router)
v1_router.include_router(workflows.router)
v1_router.include_router(executions.router)
v1_router.include_router(webhooks.router)

# Include the v1 router in the main API router
api_router.include_router(v1_router, prefix="/v1")
