from passlib.context import CryptContext
import json
import os

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
hashed = pwd_context.hash("admin123")
print(f"Hashed: {hashed}")

user_data = [
    {
        "username": "admin",
        "hashed_password": hashed
    }
]

with open("users.json", "w") as f:
    json.dump(user_data, f, indent=4)
