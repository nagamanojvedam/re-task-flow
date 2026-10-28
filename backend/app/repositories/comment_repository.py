# backend/app/repositories/comment_repository.py

import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.comment import Comment


class CommentRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(
        self,
        comment_id: uuid.UUID,
        task_id: uuid.UUID,
    ) -> Comment | None:
        statement = select(Comment).where(
            Comment.id == comment_id,
            Comment.task_id == task_id,
        )
        return self.db.scalar(statement)

    def list_by_task(
        self,
        task_id: uuid.UUID,
        *,
        page: int,
        page_size: int,
    ) -> tuple[list[Comment], int]:
        filters = [Comment.task_id == task_id]

        total_statement = (
            select(func.count())
            .select_from(Comment)
            .where(*filters)
        )
        total = self.db.scalar(total_statement) or 0

        statement = (
            select(Comment)
            .where(*filters)
            .order_by(Comment.created_at.asc(), Comment.id.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )

        items = list(self.db.scalars(statement).all())
        return items, total

    def create(
        self,
        task_id: uuid.UUID,
        author_id: uuid.UUID,
        content: str,
    ) -> Comment:
        comment = Comment(
            task_id=task_id,
            author_id=author_id,
            content=content,
        )
        self.db.add(comment)
        self.db.flush()
        self.db.refresh(comment)
        return comment

    def delete(self, comment: Comment) -> None:
        self.db.delete(comment)