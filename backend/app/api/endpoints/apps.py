from fastapi import APIRouter, HTTPException, Depends
from typing import List
from sqlalchemy.orm import Session
from ...schemas.app_item import AppItem, AppUpdate, AppCreate
from ...services import storage
from ...services.auth import get_current_user
from ...core.database import get_db


router = APIRouter()

@router.get("/apps", response_model=List[AppItem])
async def get_apps(db: Session = Depends(get_db)):
    """
    Returns a list of applications to display on the portal.
    """
    return storage.load_apps(db)

@router.post("/apps", response_model=AppItem)
async def create_app(app_in: AppCreate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    return storage.create_app(db, app_in)

@router.put("/apps/{app_id}", response_model=AppItem)
async def update_app(app_id: int, app_update: AppUpdate, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    updated_app = storage.update_app(db, app_id, app_update.model_dump())
    if not updated_app:
        raise HTTPException(status_code=404, detail="App not found")
    return updated_app

@router.delete("/apps/{app_id}")
async def delete_app(app_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    success = storage.delete_app(db, app_id)
    if not success:
        raise HTTPException(status_code=404, detail="App not found")
    return {"status": "success"}
