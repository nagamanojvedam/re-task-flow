export function StatusBadge({ status }) {
  const normalized = status ? status.toLowerCase() : "todo";

  let label = "To Do";
  let variant = "status-todo";

  if (normalized === "in_progress") {
    label = "In Progress";
    variant = "status-in-progress";
  } else if (normalized === "completed") {
    label = "Completed";
    variant = "status-completed";
  }

  return <span className={`badge ${variant}`}>{label}</span>;
}

export function PriorityBadge({ priority }) {
  const normalized = priority ? priority.toLowerCase() : "medium";

  let label = "Medium";
  let variant = "priority-medium";

  if (normalized === "low") {
    label = "Low";
    variant = "priority-low";
  } else if (normalized === "high") {
    label = "High";
    variant = "priority-high";
  }

  return <span className={`badge ${variant}`}>{label}</span>;
}

export function RoleBadge({ role, isOwner = false }) {
  if (isOwner) {
    return <span className="badge role-owner">Owner</span>;
  }

  const normalized = role ? role.toLowerCase() : "member";
  const label = normalized === "admin" ? "Admin" : "Member";
  const variant = normalized === "admin" ? "role-admin" : "role-member";

  return <span className={`badge ${variant}`}>{label}</span>;
}

