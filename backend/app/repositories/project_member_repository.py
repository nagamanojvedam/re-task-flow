# backend/app/repositories/project_member_repository.py

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.project_member import ProjectMember
from app.models.user import User


class ProjectMemberRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_project_and_user(
        self,
        project_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> ProjectMember | None:
        statement = select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id,
        )

        return self.db.scalar(statement)

    def list_by_project(
        self,
        project_id: uuid.UUID,
    ) -> list[ProjectMember]:
        statement = (
            select(ProjectMember)
            .where(ProjectMember.project_id == project_id)
            .order_by(ProjectMember.joined_at.asc())
        )

        return list(self.db.scalars(statement).all())

    def get_user_by_id(self, user_id: uuid.UUID) -> User | None:
        statement = select(User).where(User.id == user_id)
        return self.db.scalar(statement)

    def create(
        self,
        project_id: uuid.UUID,
        user_id: uuid.UUID,
        role: str,
    ) -> ProjectMember:
        membership = ProjectMember(
            project_id=project_id,
            user_id=user_id,
            role=role,
        )

        self.db.add(membership)
        self.db.flush()
        self.db.refresh(membership)

        return membership

    def delete(self, membership: ProjectMember) -> None:
        self.db.delete(membership)