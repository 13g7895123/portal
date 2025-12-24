from fastapi import APIRouter, File, UploadFile, HTTPException
import shutil
import os
import uuid
from ...services.auth import get_current_user
from fastapi import Depends


router = APIRouter()

# Resolve absolute path for storage
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
UPLOAD_DIR = os.path.join(BASE_DIR, "static", "uploads")

@router.post("/upload")
async def upload_file(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):

    try:
        # Create directory if it doesn't exist
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        
        # Generate unique filename to prevent overwrites
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_location = os.path.join(UPLOAD_DIR, unique_filename)
        
        # Save the file
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Return the URL
        # Construct absolute URL assuming localhost:8001 for now, or relative path
        # Using relative path is often safer for proxies, but we need full URL for the frontend 
        # API to store it directly in the DB as a valid src.
        # Let's return a full URL
        url = f"http://localhost:8001/static/uploads/{unique_filename}"
        
        return {"url": url, "filename": unique_filename}
    except Exception as e:
        print(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
