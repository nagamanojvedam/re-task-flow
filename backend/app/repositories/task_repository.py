
import uuid
from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.project_member import ProjectMember
from app.models.task import Task


class TaskRepository:
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

    def get_task(
        self,
        task_id: uuid.UUID,
        project_id: uuid.UUID,
    ) -> Task | None:
        statement = select(Task).where(
            Task.id == task_id,
            Task.project_id == project_id,
        )
        return self.db.scalar(statement)

    def list_by_project(
        self,
        project_id: uuid.UUID,
    ) -> list[Task]:
        statement = (
            select(Task)
            .where(Task.project_id == project_id)
            .order_by(Task.created_at.desc())
        )
        return list(self.db.scalars(statement).all())

    def list_filtered(
        self,
        project_id: uuid.UUID,
        *,
        page: int,
        page_size: int,
        status: str | None,
        priority: str | None,
        assignee_id: uuid.UUID | None,
        sort_by: str,
        sort_order: str,
    ) -> tuple[list[Task], int]:
        filters = [Task.project_id == project_id]

        if status is not None:
            filters.append(Task.status == status)

        if priority is not None:
            filters.append(Task.priority == priority)

        if assignee_id is not None:
            filters.append(Task.assignee_id == assignee_id)

        total_statement = (
            select(func.count())
            .select_from(Task)
            .where(*filters)
        )
        total = self.db.scalar(total_statement) or 0

        sort_columns = {
            "created_at": Task.created_at,
            "due_date": Task.due_date,
            "title": Task.title,
            "priority": Task.priority,
        }
        sort_column = sort_columns[sort_by]

        # Put null due dates last regardless of sort direction.
        if sort_by == "due_date":
            sort_expression = (
                sort_column.asc().nulls_last()
                if sort_order == "asc"
                else sort_column.desc().nulls_last()
            )
        else:
            sort_expression = (
                sort_column.asc()
                if sort_order == "asc"
                else sort_column.desc()
            )

        statement = (
            select(Task)
            .where(*filters)
            .order_by(sort_expression, Task.id.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )

        items = list(self.db.scalars(statement).all())
        return items, total

    def create(
        self,
        project_id: uuid.UUID,
        title: str,
        description: str | None,
        status: str,
        priority: str,
        assignee_id: uuid.UUID | None,
        due_date: date | None,
    ) -> Task:
        task = Task(
            project_id=project_id,
            title=title,
            description=description,
            status=status,
            priority=priority,
            assignee_id=assignee_id,
            due_date=due_date,
        )
        self.db.add(task)
        self.db.flush()
        self.db.refresh(task)
        return task

    def is_project_member(
        self,
        project_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> bool:
        statement = select(ProjectMember.id).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id,
        )
        return self.db.scalar(statement) is not None

    def update(self, task: Task) -> Task:
        self.db.flush()
        self.db.refresh(task)
        return task

    def delete(self, task: Task) -> None:
        self.db.delete(task)
