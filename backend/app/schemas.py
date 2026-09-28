from typing import Dict, Any, Optional
from pydantic import BaseModel

class Document(BaseModel):
    metadata: Dict[str, Any]

class AuthRequest(BaseModel):
    username: str
    password: str
