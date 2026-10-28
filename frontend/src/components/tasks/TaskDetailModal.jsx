import { useState } from "react";
import Modal from "../common/Modal";
import { StatusBadge, PriorityBadge } from "../common/Badge";
import CommentSection from "../comments/CommentSection";
import ConfirmDialog from "../common/ConfirmDialog";
import {
  formatDate,
  formatDateTime,
  isTaskOverdue,
  shortenUUID,
} from "../../utils/formatters";

export function TaskDetailModal({
  isOpen,
  onClose,
  task,
  projectName = null,
  isOwner = false,
  currentUserId,
  projectOwnerId,
  onEdit = null,
  onDelete = null,
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copiedAssignee, setCopiedAssignee] = useState(false);
  const [todayStr] = useState(() => new Date().toISOString().slice(0, 10));

  if (!task) return null;

  const isOverdue = isTaskOverdue(task.due_date, task.status, todayStr);

  function handleCopyAssignee() {
    if (!task.assignee_id) return;
    navigator.clipboard.writeText(task.assignee_id);
    setCopiedAssignee(true);
    setTimeout(() => setCopiedAssignee(false), 2000);
  }

  async function handleConfirmDelete() {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete(task);
      setShowDeleteConfirm(false);
      onClose();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Task Details"
        maxWidth="680px"
      >
        <div className="task-detail-container">
          <header className="task-detail-header">
            <div className="task-detail-badges">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
              {isOverdue && (
                <span className="badge badge-overdue">Overdue</span>
              )}
            </div>

            {isOwner && (
              <div className="task-detail-owner-actions">
                {onEdit && (
                  <button
                    type="button"
                    className="secondary-button btn-sm"
                    onClick={() => {
                      onClose();
                      onEdit(task);
                    }}
                  >
                    ✎ Edit Task
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    className="secondary-button btn-sm btn-danger-outline"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    🗑 Delete
                  </button>
                )}
              </div>
            )}
          </header>

          <h2 className="task-detail-title">{task.title}</h2>

          <div className="task-detail-description-box">
            <h4 className="detail-section-label">Description</h4>
            <p className="task-detail-description">
              {task.description || (
                <span className="text-muted">No description provided.</span>
              )}
            </p>
          </div>

          <div className="task-detail-meta-grid">
            <div className="detail-meta-item">
              <span className="meta-label">Project</span>
              <span className="meta-value">
                {projectName ? `📁 ${projectName}` : shortenUUID(task.project_id)}
              </span>
            </div>

            <div className="detail-meta-item">
              <span className="meta-label">Due Date</span>
              <span className={`meta-value ${isOverdue ? "task-overdue" : ""}`}>
                {task.due_date ? formatDate(task.due_date) : "No due date"}
              </span>
            </div>

            <div className="detail-meta-item">
              <span className="meta-label">Assignee</span>
              {task.assignee_id ? (
                <div className="assignee-val-box">
                  <span className="meta-value" title={task.assignee_id}>
                    {shortenUUID(task.assignee_id)}
                  </span>
                  <button
                    type="button"
                    className="copy-pill-btn"
                    onClick={handleCopyAssignee}
                    title="Copy Assignee UUID"
                  >
                    {copiedAssignee ? "Copied" : "Copy"}
                  </button>
                </div>
              ) : (
                <span className="meta-value text-muted">Unassigned</span>
              )}
            </div>

            <div className="detail-meta-item">
              <span className="meta-label">Created</span>
              <span className="meta-value">
                {formatDateTime(task.created_at)}
              </span>
            </div>
          </div>

          {!isOwner && (
            <div className="member-readonly-notice">
              <span>ℹ️ As a project member, you can participate in discussion below. Only the project owner can edit or delete this task.</span>
            </div>
          )}

          <hr className="detail-divider" />

          {/* Integrated Comments */}
          <CommentSection
            projectId={task.project_id}
            taskId={task.id}
            currentUserId={currentUserId}
            projectOwnerId={projectOwnerId || task.owner_id}
          />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${task.title}"? All associated comments will also be removed. This cannot be undone.`}
        confirmText="Delete Task"
        isLoading={deleting}
      />
    </>
  );
}

export default TaskDetailModal;
