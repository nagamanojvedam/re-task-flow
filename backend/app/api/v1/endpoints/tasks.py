
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.task import Task
from app.models.user import User
from app.schemas.task import (
    SortOrder,
    TaskCreate,
    TaskPageResponse,
    TaskPriority,
    TaskResponse,
    TaskSortField,
    TaskStatus,
    TaskUpdate,
)
from app.services.task_service import (
    InvalidTaskAssigneeError,
    TaskNotFoundError,
    TaskProjectNotFoundError,
    TaskService,
)

router = APIRouter(
    prefix="/projects/{project_id}/tasks",
    tags=["Tasks"],
)


def _raise_task_error(exc: Exception) -> None:
    if isinstance(exc, InvalidTaskAssigneeError):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=str(exc),
    ) from exc


@router.post(
    "",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_task(
    project_id: UUID,
    data: TaskCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Task:
    try:
        return TaskService(db).create_task(
            project_id,
            data,
            current_user,
        )
    except (TaskProjectNotFoundError, InvalidTaskAssigneeError) as exc:
        _raise_task_error(exc)


@router.get("", response_model=TaskPageResponse)
def list_tasks(
    project_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    task_status: Annotated[TaskStatus | None, Query(alias="status")] = None,
    priority: TaskPriority | None = None,
    assignee_id: UUID | None = None,
    sort_by: TaskSortField = "created_at",
    sort_order: SortOrder = "desc",
) -> dict:
    try:
        return TaskService(db).list_tasks_filtered(
            project_id=project_id,
            current_user=current_user,
            page=page,
            page_size=page_size,
            status=task_status,
            priority=priority,
            assignee_id=assignee_id,
            sort_by=sort_by,
            sort_order=sort_order,
        )
    except TaskProjectNotFoundError as exc:
        _raise_task_error(exc)


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    project_id: UUID,
    task_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Task:
    try:
        return TaskService(db).get_task(
            project_id,
            task_id,
            current_user,
        )
    except (TaskProjectNotFoundError, TaskNotFoundError) as exc:
        _raise_task_error(exc)


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    project_id: UUID,
    task_id: UUID,
    data: TaskUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Task:
    try:
        return TaskService(db).update_task(
            project_id,
            task_id,
            data,
            current_user,
        )
    except (
        TaskProjectNotFoundError,
        TaskNotFoundError,
        InvalidTaskAssigneeError,
    ) as exc:
        _raise_task_error(exc)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    project_id: UUID,
    task_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Response:
    try:
        TaskService(db).delete_task(
            project_id,
            task_id,
            current_user,
        )
    except (TaskProjectNotFoundError, TaskNotFoundError) as exc:
        _raise_task_error(exc)

    return Response(status_code=status.HTTP_204_NO_CONTENT)
