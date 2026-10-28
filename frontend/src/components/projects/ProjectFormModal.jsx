import { useState } from "react";
import Modal from "../common/Modal";
import { getApiErrorMessage } from "../../utils/formatters";

function ProjectFormInner({ onClose, onSubmit, initialData }) {
  const isEditing = Boolean(initialData);
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || null,
      });
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to save project."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form-grid">
      <div className="form-field">
        <label htmlFor="project-name">
          Project Name <span className="required-star">*</span>
        </label>
        <input
          id="project-name"
          type="text"
          placeholder="e.g. Website Redesign"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={150}
          required
          disabled={submitting}
          autoFocus
        />
        <span className="field-hint">Max 150 characters</span>
      </div>

      <div className="form-field">
        <label htmlFor="project-description">Description</label>
        <textarea
          id="project-description"
          rows={4}
          placeholder="What is this project about? (Optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={5000}
          disabled={submitting}
        />
        <span className="field-hint">Max 5000 characters</span>
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
            : "Create Project"}
        </button>
      </div>
    </form>
  );
}

export function ProjectFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
}) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Project" : "Create New Project"}
      maxWidth="500px"
    >
      <ProjectFormInner
        key={initialData?.id || "new-project"}
        onClose={onClose}
        onSubmit={onSubmit}
        initialData={initialData}
      />
    </Modal>
  );
}

export default ProjectFormModal;
