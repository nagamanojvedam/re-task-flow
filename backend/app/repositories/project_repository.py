# backend/app/repositories/project_repository.py

import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.project_member import ProjectMember


class ProjectRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_owned_project(
        self,
        project_id: uuid.UUID,
        owner_id: uuid.UUID,
    ) -> Project | None:
        statement = select(Project).where(
            Project.id == project_id,
            Project.owner_id == owner_id,
        )
        return self.db.scalar(statement)

    def get_accessible_project(
        self,
        project_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> Project | None:
        membership_exists = (
            select(ProjectMember.id)
            .where(
                ProjectMember.project_id == Project.id,
                ProjectMember.user_id == user_id,
            )
            .exists()
        )

        statement = select(Project).where(
            Project.id == project_id,
            (Project.owner_id == user_id) | membership_exists,
        )
        return self.db.scalar(statement)

    def create(
        self,
        name: str,
        description: str | None,
        owner_id: uuid.UUID,
    ) -> Project:
        project = Project(
            name=name,
            description=description,
            owner_id=owner_id,
        )
        self.db.add(project)
        self.db.flush()
        self.db.refresh(project)
        return project

    def list_by_owner(
        self,
        owner_id: uuid.UUID,
    ) -> list[Project]:
        statement = (
            select(Project)
            .where(Project.owner_id == owner_id)
            .order_by(Project.created_at.desc())
        )
        return list(self.db.scalars(statement).all())

    def list_accessible(
        self,
        user_id: uuid.UUID,
    ) -> list[Project]:
        membership_exists = (
            select(ProjectMember.id)
            .where(
                ProjectMember.project_id == Project.id,
                ProjectMember.user_id == user_id,
            )
            .exists()
        )

        statement = (
            select(Project)
            .where(
                (Project.owner_id == user_id) | membership_exists
            )
            .order_by(Project.created_at.desc(), Project.id.asc())
        )
        return list(self.db.scalars(statement).all())

    def list_accessible_paginated(
        self,
        user_id: uuid.UUID,
        *,
        page: int,
        page_size: int,
    ) -> tuple[list[Project], int]:
        membership_exists = (
            select(ProjectMember.id)
            .where(
                ProjectMember.project_id == Project.id,
                ProjectMember.user_id == user_id,
            )
            .exists()
        )

        filters = [
            (Project.owner_id == user_id) | membership_exists
        ]

        total_statement = (
            select(func.count())
            .select_from(Project)
            .where(*filters)
        )
        total = self.db.scalar(total_statement) or 0

        statement = (
            select(Project)
            .where(*filters)
            .order_by(Project.created_at.desc(), Project.id.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )

        items = list(self.db.scalars(statement).all())
        return items, total

    def delete(self, project: Project) -> None:
        self.db.delete(project)