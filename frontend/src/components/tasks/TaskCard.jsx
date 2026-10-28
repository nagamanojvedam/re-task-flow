import { useState } from "react";
import { StatusBadge, PriorityBadge } from "../common/Badge";
import { formatDate, isTaskOverdue, shortenUUID } from "../../utils/formatters";

export function TaskCard({
  task,
  projectName = null,
  isOwner = false,
  onOpen,
  onEdit = null,
  onDelete = null,
}) {
  const [todayStr] = useState(() => new Date().toISOString().slice(0, 10));
  const isOverdue = isTaskOverdue(task.due_date, task.status, todayStr);

  return (
    <article
      className="task-card"
      onClick={() => onOpen(task)}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(task);
        }
      }}
    >
      <div className="task-card-header">
        <div className="task-card-badges">
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
        </div>

        {isOwner && (
          <div
            className="task-card-actions"
            onClick={(e) => e.stopPropagation()}
          >
            {onEdit && (
              <button
                type="button"
                className="icon-button"
                onClick={() => onEdit(task)}
                title="Edit task"
                aria-label="Edit task"
              >
                ✎
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className="icon-button icon-button-danger"
                onClick={() => onDelete(task)}
                title="Delete task"
                aria-label="Delete task"
              >
                🗑
              </button>
            )}
          </div>
        )}
      </div>

      <h4 className="task-card-title">{task.title}</h4>

      {task.description && (
        <p className="task-card-description">{task.description}</p>
      )}

      {projectName && (
        <div className="task-card-project">
          <span className="task-card-project-icon">📁</span>
          <span>{projectName}</span>
        </div>
      )}

      <div className="task-card-footer">
        <div className="task-card-meta">
          {task.due_date && (
            <span
              className={`task-meta-item ${isOverdue ? "task-overdue" : ""}`}
              title={isOverdue ? "Overdue" : "Due date"}
            >
              📅 {formatDate(task.due_date)}
              {isOverdue && " (Overdue)"}
            </span>
          )}

          {task.assignee_id ? (
            <span
              className="task-meta-item task-assignee"
              title={`Assignee: ${task.assignee_id}`}
            >
              👤 {shortenUUID(task.assignee_id)}
            </span>
          ) : (
            <span className="task-meta-item task-unassigned">
              Unassigned
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export default TaskCard;
