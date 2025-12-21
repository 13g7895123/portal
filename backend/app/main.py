from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.endpoints import apps

app = FastAPI(title="Entry Portal API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(apps.router, prefix="/api", tags=["apps"])
