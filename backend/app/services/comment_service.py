# backend/app/services/comment_service.py

import math
import uuid

from sqlalchemy.orm import Session

from app.models.comment import Comment
from app.models.task import Task
from app.models.user import User
from app.repositories.comment_repository import CommentRepository
from app.repositories.project_repository import ProjectRepository
from app.repositories.task_repository import TaskRepository
from app.schemas.comment import CommentCreate


class CommentProjectNotFoundError(Exception):
    pass


class CommentTaskNotFoundError(Exception):
    pass


class CommentNotFoundError(Exception):
    pass


class CommentPermissionError(Exception):
    pass


class CommentService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.comments = CommentRepository(db)
        self.projects = ProjectRepository(db)
        self.tasks = TaskRepository(db)

    def _get_accessible_task(
        self,
        project_id: uuid.UUID,
        task_id: uuid.UUID,
        current_user: User,
    ) -> Task:
        project = self.projects.get_accessible_project(
            project_id=project_id,
            user_id=current_user.id,
        )

        if project is None:
            raise CommentProjectNotFoundError("Project not found.")

        task = self.tasks.get_task(
            task_id=task_id,
            project_id=project.id,
        )

        if task is None:
            raise CommentTaskNotFoundError("Task not found.")

        return task

    def create_comment(
        self,
        project_id: uuid.UUID,
        task_id: uuid.UUID,
        data: CommentCreate,
        current_user: User,
    ) -> Comment:
        task = self._get_accessible_task(
            project_id,
            task_id,
            current_user,
        )

        try:
            comment = self.comments.create(
                task_id=task.id,
                author_id=current_user.id,
                content=data.content,
            )
            self.db.commit()
            self.db.refresh(comment)
            return comment
        except Exception:
            self.db.rollback()
            raise

    def list_comments(
        self,
        project_id: uuid.UUID,
        task_id: uuid.UUID,
        current_user: User,
        *,
        page: int,
        page_size: int,
    ) -> dict:
        task = self._get_accessible_task(
            project_id,
            task_id,
            current_user,
        )

        items, total = self.comments.list_by_task(
            task_id=task.id,
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

    def delete_comment(
        self,
        project_id: uuid.UUID,
        task_id: uuid.UUID,
        comment_id: uuid.UUID,
        current_user: User,
    ) -> None:
        task = self._get_accessible_task(
            project_id,
            task_id,
            current_user,
        )

        comment = self.comments.get_by_id(
            comment_id=comment_id,
            task_id=task.id,
        )

        if comment is None:
            raise CommentNotFoundError("Comment not found.")

        project = self.projects.get_accessible_project(
            project_id=project_id,
            user_id=current_user.id,
        )

        if (
            comment.author_id != current_user.id
            and project.owner_id != current_user.id
        ):
            raise CommentPermissionError(
                "You can delete only your own comments."
            )

        try:
            self.comments.delete(comment)
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise