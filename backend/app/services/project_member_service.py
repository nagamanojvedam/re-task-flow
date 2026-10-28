# backend/app/services/project_member_service.py

import uuid

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.project_member import ProjectMember
from app.models.user import User
from app.repositories.project_member_repository import (
    ProjectMemberRepository,
)
from app.schemas.project_member import ProjectMemberCreate


class MembershipProjectNotFoundError(Exception):
    pass


class MembershipUserNotFoundError(Exception):
    pass


class MembershipAlreadyExistsError(Exception):
    pass


class MembershipNotFoundError(Exception):
    pass


class ProjectOwnerCannotBeMemberError(Exception):
    pass


class ProjectMemberService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.memberships = ProjectMemberRepository(db)

    def _get_owned_project(
        self,
        project_id: uuid.UUID,
        current_user: User,
    ) -> Project:
        project = self.db.get(Project, project_id)

        if project is None or project.owner_id != current_user.id:
            raise MembershipProjectNotFoundError("Project not found.")

        return project

    def add_member(
        self,
        project_id: uuid.UUID,
        data: ProjectMemberCreate,
        current_user: User,
    ) -> ProjectMember:
        project = self._get_owned_project(project_id, current_user)

        if data.user_id == project.owner_id:
            raise ProjectOwnerCannotBeMemberError(
                "The project owner does not need a membership entry."
            )

        user = self.memberships.get_user_by_id(data.user_id)

        if user is None:
            raise MembershipUserNotFoundError("User not found.")

        existing = self.memberships.get_by_project_and_user(
            project_id,
            data.user_id,
        )

        if existing is not None:
            raise MembershipAlreadyExistsError(
                "This user is already a project member."
            )

        try:
            membership = self.memberships.create(
                project_id=project_id,
                user_id=data.user_id,
                role=data.role,
            )
            self.db.commit()
            self.db.refresh(membership)
            return membership
        except IntegrityError:
            self.db.rollback()
            raise MembershipAlreadyExistsError(
                "This user is already a project member."
            ) from None
        except Exception:
            self.db.rollback()
            raise

    def list_members(
        self,
        project_id: uuid.UUID,
        current_user: User,
    ) -> list[ProjectMember]:
        self._get_owned_project(project_id, current_user)
        return self.memberships.list_by_project(project_id)

    def remove_member(
        self,
        project_id: uuid.UUID,
        user_id: uuid.UUID,
        current_user: User,
    ) -> None:
        project = self._get_owned_project(project_id, current_user)

        if user_id == project.owner_id:
            raise ProjectOwnerCannotBeMemberError(
                "The project owner cannot be removed as a member."
            )

        membership = self.memberships.get_by_project_and_user(
            project_id,
            user_id,
        )

        if membership is None:
            raise MembershipNotFoundError(
                "Project membership not found."
            )

        try:
            self.memberships.delete(membership)
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise