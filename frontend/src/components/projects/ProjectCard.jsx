import { Link } from "react-router";
import { RoleBadge } from "../common/Badge";
import { formatDate } from "../../utils/formatters";

export function ProjectCard({
  project,
  currentUserId,
  onEdit = null,
  onDelete = null,
}) {
  const isOwner = project.owner_id === currentUserId;

  return (
    <article className="project-card">
      <div className="project-card-header">
        <div className="project-card-title-group">
          <RoleBadge isOwner={isOwner} />
          <h3 className="project-card-title">
            <Link to={`/projects/${project.id}`}>{project.name}</Link>
          </h3>
        </div>

        {isOwner && (
          <div className="project-card-actions">
            {onEdit && (
              <button
                type="button"
                className="icon-button"
                onClick={() => onEdit(project)}
                title="Edit project"
                aria-label="Edit project"
              >
                ✎
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className="icon-button icon-button-danger"
                onClick={() => onDelete(project)}
                title="Delete project"
                aria-label="Delete project"
              >
                🗑
              </button>
            )}
          </div>
        )}
      </div>

      <p className="project-card-description">
        {project.description || "No description provided."}
      </p>

      <div className="project-card-footer">
        <span className="project-card-date">
          Created {formatDate(project.created_at)}
        </span>

        <Link
          to={`/projects/${project.id}`}
          className="secondary-button btn-sm"
        >
          View Details →
        </Link>
      </div>
    </article>
  );
}

export default ProjectCard;

