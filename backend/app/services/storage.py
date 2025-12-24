from sqlalchemy.orm import Session
from ..models import App
from ..schemas.app_item import AppItem, AppCreate

def load_apps(db: Session):
    apps = db.query(App).all()
    if not apps:
        # Seed default apps if empty
        default_apps = [
            {
                "title": "Dashboard",
                "icon_url": "https://ui-avatars.com/api/?name=DB&background=0D8ABC&color=fff&size=128",
                "link_url": "/dashboard",
                "description": "Main system dashboard"
            },
            {
                "title": "User Management",
                "icon_url": "https://ui-avatars.com/api/?name=UM&background=ff5252&color=fff&size=128",
                "link_url": "/users",
                "description": "Manage system users"
            },
            {
                "title": "Reports",
                "icon_url": "https://ui-avatars.com/api/?name=RP&background=4caf50&color=fff&size=128",
                "link_url": "/reports",
                "description": "View analytics and reports"
            },
            {
                "title": "Settings",
                "icon_url": "https://ui-avatars.com/api/?name=ST&background=607d8b&color=fff&size=128",
                "link_url": "/admin",
                "description": "System configuration"
            },
             {
                "title": "Help Center",
                "icon_url": "https://ui-avatars.com/api/?name=HC&background=ff9800&color=fff&size=128",
                "link_url": "/help",
                "description": "Documentation and support"
            },
        ]
        for app_data in default_apps:
            db_app = App(**app_data)
            db.add(db_app)
        db.commit()
        apps = db.query(App).all()
    
    return apps

def create_app(db: Session, app_in: AppCreate):
    db_app = App(**app_in.model_dump())
    db.add(db_app)
    db.commit()
    db.refresh(db_app)
    return db_app

def update_app(db: Session, app_id: int, app_update: dict):
    db_app = db.query(App).filter(App.id == app_id).first()
    if not db_app:
        return None
    
    for key, value in app_update.items():
        if value is not None:
            setattr(db_app, key, value)
    
    db.commit()
    db.refresh(db_app)
    return db_app

def delete_app(db: Session, app_id: int):
    db_app = db.query(App).filter(App.id == app_id).first()
    if db_app:
        db.delete(db_app)
        db.commit()
        return True
    return False
