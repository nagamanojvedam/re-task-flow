import { useState } from "react";
import Modal from "../common/Modal";
import { getApiErrorMessage, isValidUUID } from "../../utils/formatters";

export function MemberAddModal({
  isOpen,
  onClose,
  onSubmit,
}) {
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("member");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function resetForm() {
    setUserId("");
    setRole("member");
    setError("");
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const trimmed = userId.trim();
    if (!trimmed) {
      setError("User ID is required.");
      return;
    }

    if (!isValidUUID(trimmed)) {
      setError("Please enter a valid UUID (e.g. 12345678-1234-1234-1234-123456789abc).");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({ userId: trimmed, role });
      handleClose();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to add member to project."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={submitting ? () => {} : handleClose}
      title="Add Project Member"
      maxWidth="500px"
      closeOnBackdrop={!submitting}
    >
      <form onSubmit={handleSubmit} className="form-grid">
        <div className="info-box">
          <p className="info-box-text">
            <strong>How to get a User ID:</strong> Each registered user has a unique ID (UUID) displayed in their sidebar and on their dashboard. Ask your team member to share their User ID.
          </p>
        </div>

        <div className="form-field">
          <label htmlFor="member-user-id">
            User ID (UUID) <span className="required-star">*</span>
          </label>
          <input
            id="member-user-id"
            type="text"
            placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
            disabled={submitting}
            autoFocus
          />
        </div>

        <div className="form-field">
          <label htmlFor="member-role">
            Project Role <span className="required-star">*</span>
          </label>
          <select
            id="member-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={submitting}
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <span className="field-hint">
            Admins and members can view tasks and collaborate on project discussions.
          </span>
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
            onClick={handleClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="primary-button modal-submit-btn"
            disabled={submitting}
          >
            {submitting ? "Adding..." : "Add Member"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default MemberAddModal;

