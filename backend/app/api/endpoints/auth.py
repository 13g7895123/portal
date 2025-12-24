from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from ...services import auth
from ...core.database import get_db
from datetime import timedelta

router = APIRouter()

class LoginRequest(BaseModel):
    username: str
    password: str

class ProfileUpdateRequest(BaseModel):
    username: str
    password: Optional[str] = None

@router.post("/login")
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = auth.get_user_by_username(db, request.username)
    
    if not user or not auth.verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.put("/profile")
async def update_profile(request: ProfileUpdateRequest, current_user: auth.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    user_to_update = db.query(auth.User).filter(auth.User.id == current_user.id).first()
    
    if not user_to_update:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_to_update.username = request.username
    if request.password:
        user_to_update.hashed_password = auth.get_password_hash(request.password)
    
    db.commit()
    return {"message": "Profile updated successfully"}
