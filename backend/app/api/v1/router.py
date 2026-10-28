# backend/app/api/v1/router.py

from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    health,
    project_members,
    projects,
    tasks,
    comments
)

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(projects.router)
api_router.include_router(tasks.router)
api_router.include_router(project_members.router)
api_router.include_router(comments.router)