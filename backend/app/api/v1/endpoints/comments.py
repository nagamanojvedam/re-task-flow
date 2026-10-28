# backend/app/api/v1/endpoints/comments.py

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.comment import Comment
from app.models.user import User
from app.schemas.comment import (
    CommentCreate,
    CommentPageResponse,
    CommentResponse,
)
from app.services.comment_service import (
    CommentNotFoundError,
    CommentPermissionError,
    CommentProjectNotFoundError,
    CommentService,
    CommentTaskNotFoundError,
)

router = APIRouter(
    prefix="/projects/{project_id}/tasks/{task_id}/comments",
    tags=["Comments"],
)


@router.post(
    "",
    response_model=CommentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_comment(
    project_id: UUID,
    task_id: UUID,
    data: CommentCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Comment:
    try:
        return CommentService(db).create_comment(
            project_id=project_id,
            task_id=task_id,
            data=data,
            current_user=current_user,
        )
    except CommentProjectNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except CommentTaskNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("", response_model=CommentPageResponse)
def list_comments(
    project_id: UUID,
    task_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
) -> dict:
    try:
        return CommentService(db).list_comments(
            project_id=project_id,
            task_id=task_id,
            current_user=current_user,
            page=page,
            page_size=page_size,
        )
    except CommentProjectNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except CommentTaskNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.delete(
    "/{comment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_comment(
    project_id: UUID,
    task_id: UUID,
    comment_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Response:
    try:
        CommentService(db).delete_comment(
            project_id=project_id,
            task_id=task_id,
            comment_id=comment_id,
            current_user=current_user,
        )
    except CommentProjectNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except CommentTaskNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except CommentNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except CommentPermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc

    return Response(status_code=status.HTTP_204_NO_CONTENT)