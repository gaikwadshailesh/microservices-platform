from pydantic import BaseModel, Field
from typing import Dict, Any
from datetime import datetime

class Message(BaseModel):
    event_type: str = Field(..., description="Type of the event being published")
    payload: Dict[str, Any] = Field(default_factory=dict, description="Event payload data")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Event timestamp")
    service: str = Field(..., description="Name of the service publishing the event")

    class Config:
        json_schema_extra = {
            "example": {
                "event_type": "user.created",
                "payload": {"user_id": 123, "username": "john_doe"},
                "service": "user_service"
            }
        }