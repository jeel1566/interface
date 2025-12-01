"""
Main application file for the FastAPI backend.

This file initializes the FastAPI app, configures middleware,
sets up exception handlers, and includes the API routers.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError

from config import settings
from api.router import api_router
from api.v1 import dashboards
from models import models
from models.database import engine

# Create database tables
#models.Base.metadata.create_all(bind=engine)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan manager for the application.
    Used to run startup and shutdown logic.
    """
    logger.info("Starting up...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Backend URL: {settings.BACKEND_URL}")
    logger.info(f"Frontend URL: {settings.FRONTEND_URL}")
    
    # Initialize Supabase client
    from supabase import create_client
    app.state.supabase = create_client(
        str(settings.SUPABASE_URL),
        settings.SUPABASE_SERVICE_ROLE_KEY
    )
    logger.info("Supabase client initialized")
    
    yield
    
    logger.info("Shutting down...")
    # Cleanup connections if needed


app = FastAPI(
    title="n8n-interface API",
    description="Backend services for the n8n-interface.",
    version="0.1.0",
    lifespan=lifespan,
)

# --- Middleware ---
# Filter out empty CORS origins
cors_origins = [
    origin for origin in [settings.FRONTEND_URL, settings.PRODUCTION_FRONTEND_URL]
    if origin and origin.strip() != ""
]

# Add localhost for development
if settings.ENVIRONMENT == "development":
    cors_origins.extend([
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Exception Handlers ---
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Global handler for Pydantic's RequestValidationError.
    Formats the error into a more readable structure.
    """
    return JSONResponse(
        status_code=422,
        content={"detail": "Validation Error", "errors": exc.errors()},
    )


@app.exception_handler(ValidationError)
async def pydantic_validation_exception_handler(request: Request, exc: ValidationError):
    """
    Global handler for Pydantic's base ValidationError.
    """
    return JSONResponse(
        status_code=422,
        content={"detail": "Pydantic Validation Error", "errors": exc.errors()},
    )


@app.exception_handler(404)
async def not_found_exception_handler(request: Request, exc: Exception):
    """
    Global handler for 404 Not Found errors.
    """
    return JSONResponse(
        status_code=404,
        content={"detail": "Not Found", "path": request.url.path},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """
    Global handler for all other unhandled exceptions.
    Returns a generic 500 Internal Server Error response.
    """
    logger.error(f"Unhandled exception for {request.method} {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error"},
    )


# --- API Routes ---
app.include_router(api_router, prefix="/api")
app.include_router(dashboards.router, prefix="/api/v1/dashboards", tags=["Dashboards"])


# --- Health Check ---
@app.get("/health", tags=["Monitoring"])
async def health_check():
    """
    Health check endpoint to verify the service is running.
    """
    return {"status": "ok"}
