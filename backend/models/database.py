from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get Supabase connection details from environment
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_DB_PASSWORD = os.getenv("SUPABASE_DB_PASSWORD", "")

# Extract database connection details from Supabase URL
# Format: https://PROJECT_ID.supabase.co
# Database URL: postgresql://postgres:PASSWORD@db.PROJECT_ID.supabase.co:5432/postgres
if SUPABASE_URL:
    project_id = SUPABASE_URL.replace("https://", "").replace(".supabase.co", "")
    SQLALCHEMY_DATABASE_URL = f"postgresql://postgres:{SUPABASE_DB_PASSWORD}@db.{project_id}.supabase.co:5432/postgres"
else:
    # Fallback to SQLite for local development
    SQLALCHEMY_DATABASE_URL = "sqlite:///./n8n_interface.db"

# Create engine with appropriate settings
if SQLALCHEMY_DATABASE_URL.startswith("postgresql"):
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
else:
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
