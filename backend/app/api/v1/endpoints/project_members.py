# backend/app/api/v1/endpoints/project_members.py

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.project_member import ProjectMember
from app.models.user import User
from app.schemas.project_member import (
    ProjectMemberCreate,
    ProjectMemberResponse,
)
from app.services.project_member_service import (
    MembershipAlreadyExistsError,
    MembershipNotFoundError,
    MembershipProjectNotFoundError,
    MembershipUserNotFoundError,
    ProjectMemberService,
    ProjectOwnerCannotBeMemberError,
)

router = APIRouter(
    prefix="/projects/{project_id}/members",
    tags=["Project Members"],
)


@router.post(
    "",
    response_model=ProjectMemberResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_project_member(
    project_id: UUID,
    data: ProjectMemberCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ProjectMember:
    try:
        return ProjectMemberService(db).add_member(
            project_id=project_id,
            data=data,
            current_user=current_user,
        )
    except MembershipProjectNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except MembershipUserNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except MembershipAlreadyExistsError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
    except ProjectOwnerCannotBeMemberError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc


@router.get(
    "",
    response_model=list[ProjectMemberResponse],
)
def list_project_members(
    project_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[ProjectMember]:
    try:
        return ProjectMemberService(db).list_members(
            project_id=project_id,
            current_user=current_user,
        )
    except MembershipProjectNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_project_member(
    project_id: UUID,
    user_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Response:
    try:
        ProjectMemberService(db).remove_member(
            project_id=project_id,
            user_id=user_id,
            current_user=current_user,
        )
    except MembershipProjectNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except MembershipNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except ProjectOwnerCannotBeMemberError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    return Response(status_code=status.HTTP_204_NO_CONTENT)