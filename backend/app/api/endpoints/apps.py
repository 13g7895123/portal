from fastapi import APIRouter, HTTPException
from typing import List
from ...schemas.app_item import AppItem, AppUpdate, AppCreate
from ...services.storage import load_apps, save_apps
from ...services.auth import get_current_user
from fastapi import Depends


router = APIRouter()

@router.get("/apps", response_model=List[AppItem])
async def get_apps():
    """
    Returns a list of applications to display on the portal.
    """
    return load_apps()

@router.post("/apps", response_model=AppItem)
async def create_app(app_in: AppCreate, current_user: dict = Depends(get_current_user)):
    apps = load_apps()
    new_id = max([a["id"] for a in apps]) + 1 if apps else 1
    new_app = AppItem(id=new_id, **app_in.model_dump())
    apps.append(new_app.model_dump())
    save_apps([AppItem(**a) for a in apps])
    return new_app

@router.put("/apps/{app_id}", response_model=AppItem)
async def update_app(app_id: int, app_update: AppUpdate, current_user: dict = Depends(get_current_user)):
    apps = load_apps()
    for i, app_data in enumerate(apps):
        if app_data["id"] == app_id:
            current_app = AppItem(**app_data)
            if app_update.title is not None:
                current_app.title = app_update.title
            if app_update.icon_url is not None:
                current_app.icon_url = app_update.icon_url
            if app_update.link_url is not None:
                current_app.link_url = app_update.link_url
            if app_update.description is not None:
                current_app.description = app_update.description
            
            apps[i] = current_app.model_dump()
            save_apps([AppItem(**a) for a in apps])
            return current_app
            
    raise HTTPException(status_code=404, detail="App not found")

@router.delete("/apps/{app_id}")
async def delete_app(app_id: int, current_user: dict = Depends(get_current_user)):
    apps = load_apps()
    filtered_apps = [a for a in apps if a["id"] != app_id]
    if len(filtered_apps) == len(apps):
        raise HTTPException(status_code=404, detail="App not found")
    save_apps([AppItem(**a) for a in filtered_apps])
    return {"status": "success"}
