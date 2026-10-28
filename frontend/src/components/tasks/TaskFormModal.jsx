import { useState } from "react";
import Modal from "../common/Modal";
import { getApiErrorMessage, isValidUUID } from "../../utils/formatters";

function TaskFormInner({
  onClose,
  onSubmit,
  initialData,
  members = [],
  ownerId = null,
}) {
  const isEditing = Boolean(initialData);

  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [status, setStatus] = useState(initialData?.status || "todo");
  const [priority, setPriority] = useState(initialData?.priority || "medium");
  const initAssignee = initialData?.assignee_id || "";
  const [assigneeId, setAssigneeId] = useState(initAssignee);

  const isKnownAssignee =
    !initAssignee ||
    initAssignee === ownerId ||
    members.some((m) => m.user_id === initAssignee);
  const [customAssignee, setCustomAssignee] = useState(!isKnownAssignee && Boolean(initAssignee));

  const [dueDate, setDueDate] = useState(initialData?.due_date || "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }

    const trimmedAssignee = assigneeId.trim();
    if (trimmedAssignee && !isValidUUID(trimmedAssignee)) {
      setError("Please enter a valid UUID for the assignee.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
        assigneeId: trimmedAssignee || null,
        dueDate: dueDate || null,
      });
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to save task."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form-grid">
      <div className="form-field">
        <label htmlFor="task-title">
          Title <span className="required-star">*</span>
        </label>
        <input
          id="task-title"
          type="text"
          placeholder="e.g. Implement user authentication"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          required
          disabled={submitting}
          autoFocus
        />
        <span className="field-hint">Max 200 characters</span>
      </div>

      <div className="form-field">
        <label htmlFor="task-description">Description</label>
        <textarea
          id="task-description"
          rows={3}
          placeholder="Add details, acceptance criteria, or notes... (Optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={5000}
          disabled={submitting}
        />
        <span className="field-hint">Max 5000 characters</span>
      </div>

      <div className="form-row-2">
        <div className="form-field">
          <label htmlFor="task-status">
            Status <span className="required-star">*</span>
          </label>
          <select
            id="task-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={submitting}
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="task-priority">
            Priority <span className="required-star">*</span>
          </label>
          <select
            id="task-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            disabled={submitting}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      <div className="form-row-2">
        <div className="form-field">
          <label htmlFor="task-due-date">Due Date</label>
          <input
            id="task-due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={submitting}
          />
        </div>

        <div className="form-field">
          <label htmlFor="task-assignee-select">Assignee</label>
          {!customAssignee ? (
            <select
              id="task-assignee-select"
              value={assigneeId}
              onChange={(e) => {
                if (e.target.value === "custom") {
                  setCustomAssignee(true);
                  setAssigneeId("");
                } else {
                  setAssigneeId(e.target.value);
                }
              }}
              disabled={submitting}
            >
              <option value="">Unassigned</option>
              {ownerId && (
                <option value={ownerId}>
                  Project Owner ({ownerId.slice(0, 8)}...)
                </option>
              )}
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  Member ({m.user_id.slice(0, 8)}...)
                </option>
              ))}
              <option value="custom">+ Enter UUID manually...</option>
            </select>
          ) : (
            <div className="assignee-input-group">
              <input
                type="text"
                placeholder="Enter User UUID"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                disabled={submitting}
              />
              <button
                type="button"
                className="secondary-button btn-sm"
                onClick={() => {
                  setCustomAssignee(false);
                  setAssigneeId("");
                }}
                title="Switch back to dropdown"
              >
                List
              </button>
            </div>
          )}
          <span className="field-hint">
            Must be project owner or an added project member.
          </span>
        </div>
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <div className="modal-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={onClose}
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="primary-button modal-submit-btn"
          disabled={submitting}
        >
          {submitting
            ? isEditing
              ? "Updating..."
              : "Creating..."
            : isEditing
            ? "Save Changes"
            : "Create Task"}
        </button>
      </div>
    </form>
  );
}

export function TaskFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  members = [],
  ownerId = null,
}) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Task" : "Create New Task"}
      maxWidth="560px"
    >
      <TaskFormInner
        key={initialData?.id || "new-task"}
        onClose={onClose}
        onSubmit={onSubmit}
        initialData={initialData}
        members={members}
        ownerId={ownerId}
      />
    </Modal>
  );
}

export default TaskFormModal;
