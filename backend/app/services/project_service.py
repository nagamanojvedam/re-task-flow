# backend/app/services/project_service.py

import math
import uuid

from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.user import User
from app.repositories.project_repository import ProjectRepository
from app.schemas.project import ProjectCreate, ProjectUpdate


class ProjectNotFoundError(Exception):
    pass


class ProjectService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.projects = ProjectRepository(db)

    def create_project(
        self,
        data: ProjectCreate,
        current_user: User,
    ) -> Project:
        try:
            project = self.projects.create(
                name=data.name,
                description=data.description,
                owner_id=current_user.id,
            )
            self.db.commit()
            self.db.refresh(project)
            return project
        except Exception:
            self.db.rollback()
            raise

    def list_my_projects(
        self,
        current_user: User,
    ) -> list[Project]:
        return self.projects.list_accessible(current_user.id)

    def list_my_projects_paginated(
        self,
        current_user: User,
        *,
        page: int,
        page_size: int,
    ) -> dict:
        items, total = self.projects.list_accessible_paginated(
            user_id=current_user.id,
            page=page,
            page_size=page_size,
        )

        return {
            "items": items,
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": math.ceil(total / page_size) if total else 0,
        }

    def get_project(
        self,
        project_id: uuid.UUID,
        current_user: User,
    ) -> Project:
        project = self.projects.get_accessible_project(
            project_id=project_id,
            user_id=current_user.id,
        )

        if project is None:
            raise ProjectNotFoundError("Project not found.")

        return project

    def update_project(
        self,
        project_id: uuid.UUID,
        data: ProjectUpdate,
        current_user: User,
    ) -> Project:
        project = self.projects.get_owned_project(
            project_id=project_id,
            owner_id=current_user.id,
        )

        if project is None:
            raise ProjectNotFoundError("Project not found.")

        try:
            project.name = data.name
            project.description = data.description

            self.db.commit()
            self.db.refresh(project)
            return project
        except Exception:
            self.db.rollback()
            raise

    def delete_project(
        self,
        project_id: uuid.UUID,
        current_user: User,
    ) -> None:
        project = self.projects.get_owned_project(
            project_id=project_id,
            owner_id=current_user.id,
        )

        if project is None:
            raise ProjectNotFoundError("Project not found.")

        try:
            self.projects.delete(project)
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise