
import math
import uuid

from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.task import Task
from app.models.user import User
from app.repositories.task_repository import TaskRepository
from app.schemas.task import (
    SortOrder,
    TaskCreate,
    TaskPriority,
    TaskSortField,
    TaskStatus,
    TaskUpdate,
)


class TaskProjectNotFoundError(Exception):
    pass


class TaskNotFoundError(Exception):
    pass


class InvalidTaskAssigneeError(Exception):
    pass


class TaskService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.tasks = TaskRepository(db)

    def _get_owned_project(
        self,
        project_id: uuid.UUID,
        current_user: User,
    ) -> Project:
        project = self.tasks.get_owned_project(
            project_id=project_id,
            owner_id=current_user.id,
        )

        if project is None:
            raise TaskProjectNotFoundError("Project not found.")

        return project

    def _get_accessible_project(
        self,
        project_id: uuid.UUID,
        current_user: User,
    ) -> Project:
        project = self.tasks.get_owned_project(
            project_id=project_id,
            owner_id=current_user.id,
        )

        if project is not None:
            return project

        if not self.tasks.is_project_member(
            project_id=project_id,
            user_id=current_user.id,
        ):
            raise TaskProjectNotFoundError("Project not found.")

        project = self.db.get(Project, project_id)

        if project is None:
            raise TaskProjectNotFoundError("Project not found.")

        return project

    def _validate_assignee(
        self,
        project: Project,
        assignee_id: uuid.UUID | None,
    ) -> None:
        if assignee_id is None or assignee_id == project.owner_id:
            return

        if not self.tasks.is_project_member(
            project_id=project.id,
            user_id=assignee_id,
        ):
            raise InvalidTaskAssigneeError(
                "The assignee must be the project owner or a project member."
            )

    def create_task(
        self,
        project_id: uuid.UUID,
        data: TaskCreate,
        current_user: User,
    ) -> Task:
        project = self._get_owned_project(project_id, current_user)
        self._validate_assignee(project, data.assignee_id)

        try:
            task = self.tasks.create(
                project_id=project.id,
                title=data.title,
                description=data.description,
                status=data.status,
                priority=data.priority,
                assignee_id=data.assignee_id,
                due_date=data.due_date,
            )
            self.db.commit()
            self.db.refresh(task)
            return task
        except Exception:
            self.db.rollback()
            raise

    def list_tasks(
        self,
        project_id: uuid.UUID,
        current_user: User,
    ) -> list[Task]:
        project = self._get_accessible_project(
            project_id,
            current_user,
        )
        return self.tasks.list_by_project(project.id)

    def list_tasks_filtered(
        self,
        project_id: uuid.UUID,
        current_user: User,
        *,
        page: int,
        page_size: int,
        status: TaskStatus | None,
        priority: TaskPriority | None,
        assignee_id: uuid.UUID | None,
        sort_by: TaskSortField,
        sort_order: SortOrder,
    ) -> dict:
        project = self._get_accessible_project(
            project_id,
            current_user,
        )

        items, total = self.tasks.list_filtered(
            project_id=project.id,
            page=page,
            page_size=page_size,
            status=status,
            priority=priority,
            assignee_id=assignee_id,
            sort_by=sort_by,
            sort_order=sort_order,
        )

        return {
            "items": items,
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": math.ceil(total / page_size) if total else 0,
        }

    def get_task(
        self,
        project_id: uuid.UUID,
        task_id: uuid.UUID,
        current_user: User,
    ) -> Task:
        project = self._get_accessible_project(
            project_id,
            current_user,
        )
        task = self.tasks.get_task(task_id, project.id)

        if task is None:
            raise TaskNotFoundError("Task not found.")

        return task

    def update_task(
        self,
        project_id: uuid.UUID,
        task_id: uuid.UUID,
        data: TaskUpdate,
        current_user: User,
    ) -> Task:
        project = self._get_owned_project(project_id, current_user)
        task = self.tasks.get_task(task_id, project.id)

        if task is None:
            raise TaskNotFoundError("Task not found.")

        self._validate_assignee(project, data.assignee_id)

        try:
            task.title = data.title
            task.description = data.description
            task.status = data.status
            task.priority = data.priority
            task.assignee_id = data.assignee_id
            task.due_date = data.due_date

            self.tasks.update(task)
            self.db.commit()
            self.db.refresh(task)
            return task
        except Exception:
            self.db.rollback()
            raise

    def delete_task(
        self,
        project_id: uuid.UUID,
        task_id: uuid.UUID,
        current_user: User,
    ) -> None:
        project = self._get_owned_project(project_id, current_user)
        task = self.tasks.get_task(task_id, project.id)

        if task is None:
            raise TaskNotFoundError("Task not found.")

        try:
            self.tasks.delete(task)
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise
