from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional
from ...services.auth import load_users, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, get_current_user
from datetime import timedelta

router = APIRouter()

class LoginRequest(BaseModel):
    username: str
    password: str

class ProfileUpdateRequest(BaseModel):
    username: str
    password: Optional[str] = None

@router.post("/login")
async def login(request: LoginRequest):
    users = load_users()
    user = next((u for u in users if u["username"] == request.username), None)
    
    if not user or not verify_password(request.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.put("/profile")
async def update_profile(request: ProfileUpdateRequest, current_user: dict = Depends(get_current_user)):
    from app.services.auth import load_users, save_users, get_password_hash
    
    users = load_users()
    user_to_update = next((u for u in users if u["username"] == current_user["username"]), None)
    
    if not user_to_update:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_to_update["username"] = request.username
    if request.password:
        user_to_update["hashed_password"] = get_password_hash(request.password)
    
    save_users(users)
    return {"message": "Profile updated successfully"}
