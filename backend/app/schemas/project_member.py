# backend/app/schemas/project_member.py

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


ProjectMemberRole = Literal["member", "admin"]


class ProjectMemberCreate(BaseModel):
    user_id: UUID
    role: ProjectMemberRole = "member"


class ProjectMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    user_id: UUID
    role: ProjectMemberRole
    joined_at: datetime