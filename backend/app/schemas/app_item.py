from pydantic import BaseModel
from typing import Optional

class AppItem(BaseModel):
    id: int
    title: str
    icon_url: str
    link_url: str
    description: str

class AppUpdate(BaseModel):
    title: Optional[str] = None
    icon_url: Optional[str] = None
    link_url: Optional[str] = None
    description: Optional[str] = None
