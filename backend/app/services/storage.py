import json
import os
from ..schemas.app_item import AppItem

# Resolve absolute path for persistence
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_FILE = os.path.join(BASE_DIR, "apps.json")

def load_apps():
    if not os.path.exists(DATA_FILE):
        default_apps = [
            {
                "id": 1,
                "title": "Dashboard",
                "icon_url": "https://ui-avatars.com/api/?name=DB&background=0D8ABC&color=fff&size=128",
                "link_url": "/dashboard",
                "description": "Main system dashboard"
            },
            {
                "id": 2,
                "title": "User Management",
                "icon_url": "https://ui-avatars.com/api/?name=UM&background=ff5252&color=fff&size=128",
                "link_url": "/users",
                "description": "Manage system users"
            },
            {
                "id": 3,
                "title": "Reports",
                "icon_url": "https://ui-avatars.com/api/?name=RP&background=4caf50&color=fff&size=128",
                "link_url": "/reports",
                "description": "View analytics and reports"
            },
            {
                "id": 4,
                "title": "Settings",
                "icon_url": "https://ui-avatars.com/api/?name=ST&background=607d8b&color=fff&size=128",
                "link_url": "/settings",
                "description": "System configuration"
            },
             {
                "id": 5,
                "title": "Help Center",
                "icon_url": "https://ui-avatars.com/api/?name=HC&background=ff9800&color=fff&size=128",
                "link_url": "/help",
                "description": "Documentation and support"
            },
        ]
        save_apps([AppItem(**app) for app in default_apps]) # Ensure correct format if needed, but dicts are fine for json
        return default_apps # Return dicts for simple usage
    
    with open(DATA_FILE, "r") as f:
        return json.load(f)

def save_apps(apps):
    # Convert Pydantic models to dicts if necessary
    data = [app.model_dump() if hasattr(app, 'model_dump') else app for app in apps]
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=4)
