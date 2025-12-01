from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class Dashboard(Base):
    __tablename__ = "dashboards"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    workflow_id = Column(String, index=True)
    instance_id = Column(String, index=True)
    theme_color = Column(String, default="blue")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    fields = relationship("DashboardField", back_populates="dashboard", cascade="all, delete-orphan")

class DashboardField(Base):
    __tablename__ = "dashboard_fields"

    id = Column(Integer, primary_key=True, index=True)
    dashboard_id = Column(Integer, ForeignKey("dashboards.id"))
    name = Column(String)  # The key to send to n8n
    label = Column(String) # The label shown to user
    type = Column(String)  # text, number, email, etc.
    required = Column(Boolean, default=False)
    default_value = Column(String, nullable=True)
    description = Column(String, nullable=True)
    options = Column(JSON, nullable=True) # For select inputs
    
    dashboard = relationship("Dashboard", back_populates="fields")
