import json
import os
import sys

# Environment detection and setup
if os.path.exists('/app'):
    # We are likely inside the docker container
    sys.path.append('/app')
    DATA_DIR = '/app'
else:
    # We are likely on the host machine
    # Assume script is in project root, backend is in ./backend
    backend_path = os.path.join(os.getcwd(), 'backend')
    if os.path.exists(backend_path):
        sys.path.append(backend_path)
        DATA_DIR = backend_path
    else:
        # Fallback to current directory
        sys.path.append(os.getcwd())
        DATA_DIR = os.getcwd()

try:
    from app.core.database import SessionLocal, engine, Base
    from app.models import User, App
    from app.services.auth import get_password_hash
except ImportError as e:
    print(f"Error importing app modules: {e}")
    print("Please ensure you are running this script from the project root or inside the container.")
    sys.exit(1)

def migrate():
    print("Starting database migration...")
    
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Helper to find file
    def get_data_file(filename):
        # Check DATA_DIR
        path = os.path.join(DATA_DIR, filename)
        if os.path.exists(path): return path
        # Check cwd
        if os.path.exists(filename): return filename
        return None

    # 1. Migrate Users
    users_source = get_data_file('users.json')
    if users_source:
        print(f"Processing users from {users_source}...")
        try:
            with open(users_source, 'r') as f:
                users_data = json.load(f)
                count = 0
                for u_data in users_data:
                    # Check by username
                    exists = db.query(User).filter(User.username == u_data['username']).first()
                    if not exists:
                        user = User(
                            username=u_data['username'],
                            hashed_password=u_data['hashed_password']
                        )
                        db.add(user)
                        count += 1
                db.commit()
                print(f"  - Added {count} new users.")
        except Exception as e:
            print(f"  - Error processing users: {e}")
    else:
        # Auto-create admin if no users source and no admin exists
        if not db.query(User).filter(User.username == "admin").first():
             print("No users.json found. Creating default admin user...")
             admin = User(username="admin", hashed_password=get_password_hash("admin888"))
             db.add(admin)
             db.commit()

    # 2. Migrate Apps
    apps_source = get_data_file('apps.json')
    if apps_source:
        print(f"Processing apps from {apps_source}...")
        try:
            with open(apps_source, 'r') as f:
                apps_data = json.load(f)
                count = 0
                for a_data in apps_data:
                    # Check by title (or could use link_url/id if available, but title is safe enough for now)
                    exists = db.query(App).filter(App.title == a_data['title']).first()
                    if not exists:
                        app = App(
                            title=a_data['title'],
                            icon_url=a_data['icon_url'],
                            link_url=a_data['link_url'],
                            description=a_data.get('description', '')
                        )
                        db.add(app)
                        count += 1
                db.commit()
                print(f"  - Added {count} new apps.")
        except Exception as e:
             print(f"  - Error processing apps: {e}")
    else:
        print("No apps.json found, skipping app migration.")

    db.close()
    print("Migration completed successfully.")

if __name__ == "__main__":
    migrate()
