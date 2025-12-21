from fastapi import APIRouter, HTTPException
from typing import List
from ...schemas.app_item import AppItem, AppUpdate
from ...services.storage import load_apps, save_apps

router = APIRouter()

@router.get("/apps", response_model=List[AppItem])
async def get_apps():
    """
    Returns a list of applications to display on the portal.
    """
    return load_apps()

@router.put("/apps/{app_id}", response_model=AppItem)
async def update_app(app_id: int, app_update: AppUpdate):
    apps = load_apps()
    for i, app_data in enumerate(apps):
        if app_data["id"] == app_id:
            # Create a dict from existing data to update
            current_app = AppItem(**app_data)
            
            # Update fields
            if app_update.title is not None:
                current_app.title = app_update.title
            if app_update.icon_url is not None:
                current_app.icon_url = app_update.icon_url
            if app_update.link_url is not None:
                current_app.link_url = app_update.link_url
            if app_update.description is not None:
                current_app.description = app_update.description
            
            # Save back
            apps[i] = current_app.model_dump()
            save_apps([AppItem(**a) for a in apps]) # Helper expects objects or dicts handled inside
            return current_app
            
    raise HTTPException(status_code=404, detail="App not found")
