import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useAuth } from "../context/useAuth";
import {
  getProject,
  updateProject,
  deleteProject,
} from "../api/projects";
import {
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
} from "../api/projectMembers";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from "../api/tasks";
import PageHeader from "../components/layout/PageHeader";
import { RoleBadge } from "../components/common/Badge";
import TaskCard from "../components/tasks/TaskCard";
import TaskFilters from "../components/tasks/TaskFilters";
import TaskFormModal from "../components/tasks/TaskFormModal";
import TaskDetailModal from "../components/tasks/TaskDetailModal";
import ProjectFormModal from "../components/projects/ProjectFormModal";
import MemberAddModal from "../components/projects/MemberAddModal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Pagination from "../components/common/Pagination";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorMessage from "../components/common/ErrorMessage";
import EmptyState from "../components/common/EmptyState";
import {
  formatDate,
  formatDateTime,
  getApiErrorMessage,
  shortenUUID,
} from "../utils/formatters";

export default function ProjectDetailsPage() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");

  const [project, setProject] = useState(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [projectError, setProjectError] = useState("");

  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState("");

  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState("");
  const [tasksPage, setTasksPage] = useState(1);
  const [tasksPageSize] = useState(15);
  const [tasksTotal, setTasksTotal] = useState(0);
  const [tasksTotalPages, setTasksTotalPages] = useState(1);

  const [taskFilters, setTaskFilters] = useState({
    status: null,
    priority: null,
    assigneeId: null,
    sortBy: "created_at",
    sortOrder: "desc",
  });

  const [taskStats, setTaskStats] = useState({
    total: 0,
    todo: 0,
    inProgress: 0,
    completed: 0,
  });

  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [isDeleteProjectOpen, setIsDeleteProjectOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);

  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [deletingTask, setDeletingTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [removingMember, setRemovingMember] = useState(false);

  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [copiedId, setCopiedId] = useState(false);

  const isOwner = project && user ? project.owner_id === user.id : false;

  // 1. Initial Project Fetch
  useEffect(() => {
    let active = true;

    async function loadProject() {
      try {
        const data = await getProject(projectId);
        if (active) {
          setProject(data);
          setProjectLoading(false);
        }
      } catch (err) {
        if (active) {
          setProjectError(getApiErrorMessage(err, "Failed to load project details."));
          setProjectLoading(false);
        }
      }
    }

    loadProject();

    return () => {
      active = false;
    };
  }, [projectId]);

  // 2. Initial Members Fetch if Owner
  useEffect(() => {
    if (!project || !isOwner) return;
    let active = true;

    async function loadMembers() {
      try {
        const data = await getProjectMembers(projectId);
        if (active) {
          setMembers(data || []);
          setMembersLoading(false);
        }
      } catch (err) {
        if (active) {
          if (err.response?.status !== 404 && err.response?.status !== 403) {
            setMembersError(getApiErrorMessage(err, "Failed to load members."));
          }
          setMembersLoading(false);
        }
      }
    }

    loadMembers();

    return () => {
      active = false;
    };
  }, [project, isOwner, projectId]);

  // 3. Tasks Fetch
  useEffect(() => {
    if (!project) return;
    let active = true;

    async function loadTasks() {
      try {
        const data = await getTasks(projectId, {
          page: tasksPage,
          pageSize: tasksPageSize,
          status: taskFilters.status,
          priority: taskFilters.priority,
          assigneeId: taskFilters.assigneeId,
          sortBy: taskFilters.sortBy,
          sortOrder: taskFilters.sortOrder,
        });

        if (active) {
          setTasks(data.items || []);
          setTasksTotal(data.total || 0);
          setTasksTotalPages(data.total_pages || 1);
          setTasksLoading(false);
        }
      } catch (err) {
        if (active) {
          setTasksError(getApiErrorMessage(err, "Failed to load tasks."));
          setTasksLoading(false);
        }
      }
    }

    loadTasks();

    return () => {
      active = false;
    };
  }, [project, projectId, tasksPage, tasksPageSize, taskFilters]);

  // 4. Task Overview Stats Fetch
  useEffect(() => {
    if (!project) return;
    let active = true;

    async function loadStats() {
      try {
        const [allRes, todoRes, inProgRes, doneRes] = await Promise.all([
          getTasks(projectId, { page: 1, pageSize: 1 }),
          getTasks(projectId, { page: 1, pageSize: 1, status: "todo" }),
          getTasks(projectId, { page: 1, pageSize: 1, status: "in_progress" }),
          getTasks(projectId, { page: 1, pageSize: 1, status: "completed" }),
        ]);

        if (active) {
          setTaskStats({
            total: allRes.total || 0,
            todo: todoRes.total || 0,
            inProgress: inProgRes.total || 0,
            completed: doneRes.total || 0,
          });
        }
      } catch {
        // Non-critical
      }
    }

    loadStats();

    return () => {
      active = false;
    };
  }, [project, projectId]);

  // Handlers for manual refetches
  const refetchMembers = useCallback(async () => {
    setMembersLoading(true);
    setMembersError("");
    try {
      const data = await getProjectMembers(projectId);
      setMembers(data || []);
    } catch (err) {
      if (err.response?.status !== 404 && err.response?.status !== 403) {
        setMembersError(getApiErrorMessage(err, "Failed to load members."));
      }
    } finally {
      setMembersLoading(false);
    }
  }, [projectId]);

  const refetchTasks = useCallback(
    async (pageToFetch = 1) => {
      setTasksLoading(true);
      setTasksError("");
      try {
        const data = await getTasks(projectId, {
          page: pageToFetch,
          pageSize: tasksPageSize,
          status: taskFilters.status,
          priority: taskFilters.priority,
          assigneeId: taskFilters.assigneeId,
          sortBy: taskFilters.sortBy,
          sortOrder: taskFilters.sortOrder,
        });
        setTasks(data.items || []);
        setTasksPage(data.page || 1);
        setTasksTotal(data.total || 0);
        setTasksTotalPages(data.total_pages || 1);
      } catch (err) {
        setTasksError(getApiErrorMessage(err, "Failed to load tasks."));
      } finally {
        setTasksLoading(false);
      }
    },
    [projectId, tasksPageSize, taskFilters]
  );

  const refetchStats = useCallback(async () => {
    try {
      const [allRes, todoRes, inProgRes, doneRes] = await Promise.all([
        getTasks(projectId, { page: 1, pageSize: 1 }),
        getTasks(projectId, { page: 1, pageSize: 1, status: "todo" }),
        getTasks(projectId, { page: 1, pageSize: 1, status: "in_progress" }),
        getTasks(projectId, { page: 1, pageSize: 1, status: "completed" }),
      ]);
      setTaskStats({
        total: allRes.total || 0,
        todo: todoRes.total || 0,
        inProgress: inProgRes.total || 0,
        completed: doneRes.total || 0,
      });
    } catch {
      // Non-critical
    }
  }, [projectId]);

  // Project Mutations
  async function handleUpdateProject(data) {
    const updated = await updateProject(projectId, data);
    setProject(updated);
    setIsEditProjectOpen(false);
    setFeedbackMessage("Project updated successfully.");
    setTimeout(() => setFeedbackMessage(""), 4000);
  }

  async function handleDeleteProject() {
    setDeletingProject(true);
    try {
      await deleteProject(projectId);
      navigate("/projects", { replace: true });
    } catch (err) {
      setProjectError(getApiErrorMessage(err, "Failed to delete project."));
      setDeletingProject(false);
    }
  }

  // Task Mutations
  async function handleCreateTask(data) {
    await createTask(projectId, data);
    setIsAddTaskOpen(false);
    setFeedbackMessage("Task created successfully.");
    setTimeout(() => setFeedbackMessage(""), 4000);
    await refetchTasks(1);
    await refetchStats();
  }

  async function handleUpdateTask(data) {
    if (!taskToEdit) return;
    await updateTask(projectId, taskToEdit.id, data);
    setTaskToEdit(null);
    setFeedbackMessage("Task updated successfully.");
    setTimeout(() => setFeedbackMessage(""), 4000);
    await refetchTasks(tasksPage);
    await refetchStats();
  }

  async function handleDeleteTask(task) {
    setDeletingTask(true);
    try {
      await deleteTask(projectId, task.id);
      setTaskToDelete(null);
      setFeedbackMessage("Task deleted successfully.");
      setTimeout(() => setFeedbackMessage(""), 4000);
      await refetchTasks(tasksPage);
      await refetchStats();
    } catch (err) {
      setTasksError(getApiErrorMessage(err, "Failed to delete task."));
    } finally {
      setDeletingTask(false);
    }
  }

  // Member Mutations
  async function handleAddMember(data) {
    await addProjectMember(projectId, data);
    setIsAddMemberOpen(false);
    setFeedbackMessage("Member added successfully.");
    setTimeout(() => setFeedbackMessage(""), 4000);
    await refetchMembers();
  }

  async function handleRemoveMember() {
    if (!memberToRemove) return;
    setRemovingMember(true);
    try {
      await removeProjectMember(projectId, memberToRemove.user_id);
      setMemberToRemove(null);
      setFeedbackMessage("Member removed from project.");
      setTimeout(() => setFeedbackMessage(""), 4000);
      await refetchMembers();
    } catch (err) {
      setMembersError(getApiErrorMessage(err, "Failed to remove member."));
    } finally {
      setRemovingMember(false);
    }
  }

  function handleCopyProjectId() {
    navigator.clipboard.writeText(projectId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  }

  if (projectLoading) {
    return (
      <div className="page-container">
        <LoadingSpinner size="large" message="Loading project details..." />
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="page-container">
        <ErrorMessage
          title="Project Not Found"
          message={
            projectError ||
            "The requested project does not exist or you do not have permission to view it."
          }
        />
        <div style={{ marginTop: "24px" }}>
          <Link to="/projects" className="primary-button btn-inline">
            ← Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title={project.name}
        description={project.description || "No description provided."}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Projects", href: "/projects" },
          { label: project.name },
        ]}
        actions={
          <div className="page-header-actions-group">
            {isOwner && (
              <>
                <button
                  type="button"
                  className="primary-button btn-sm"
                  onClick={() => setIsAddTaskOpen(true)}
                >
                  + Add Task
                </button>
                <button
                  type="button"
                  className="secondary-button btn-sm"
                  onClick={() => setIsEditProjectOpen(true)}
                >
                  ✎ Edit Project
                </button>
                <button
                  type="button"
                  className="secondary-button btn-sm btn-danger-outline"
                  onClick={() => setIsDeleteProjectOpen(true)}
                >
                  🗑 Delete
                </button>
              </>
            )}
          </div>
        }
      />

      {feedbackMessage && (
        <div className="success-banner" role="status">
          ✓ {feedbackMessage}
        </div>
      )}

      {/* Tabs Bar */}
      <div className="tabs-bar" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "overview"}
          className={`tab-btn ${activeTab === "overview" ? "tab-btn-active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          📊 Overview
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "tasks"}
          className={`tab-btn ${activeTab === "tasks" ? "tab-btn-active" : ""}`}
          onClick={() => setActiveTab("tasks")}
        >
          ✓ Tasks ({tasksTotal})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "members"}
          className={`tab-btn ${activeTab === "members" ? "tab-btn-active" : ""}`}
          onClick={() => setActiveTab("members")}
        >
          👥 Members {isOwner ? `(${members.length})` : ""}
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="tab-pane">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon stat-icon-tasks">✓</div>
              <div className="stat-content">
                <span className="stat-label">Total Tasks</span>
                <span className="stat-value">{taskStats.total}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon stat-icon-todo">📋</div>
              <div className="stat-content">
                <span className="stat-label">To Do</span>
                <span className="stat-value">{taskStats.todo}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon stat-icon-progress">⏳</div>
              <div className="stat-content">
                <span className="stat-label">In Progress</span>
                <span className="stat-value">{taskStats.inProgress}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon stat-icon-completed">🎉</div>
              <div className="stat-content">
                <span className="stat-label">Completed</span>
                <span className="stat-value">{taskStats.completed}</span>
              </div>
            </div>
          </div>

          <div className="project-overview-grid">
            <section className="overview-card">
              <h3 className="overview-card-title">Project Details</h3>
              <dl className="details-list">
                <div className="details-item">
                  <dt>Role</dt>
                  <dd>
                    <RoleBadge isOwner={isOwner} />
                  </dd>
                </div>

                <div className="details-item">
                  <dt>Project ID</dt>
                  <dd className="id-with-copy">
                    <code>{project.id}</code>
                    <button
                      type="button"
                      className="copy-pill-btn"
                      onClick={handleCopyProjectId}
                    >
                      {copiedId ? "Copied" : "Copy"}
                    </button>
                  </dd>
                </div>

                <div className="details-item">
                  <dt>Owner ID</dt>
                  <dd>
                    <code>{project.owner_id}</code>
                  </dd>
                </div>

                <div className="details-item">
                  <dt>Created At</dt>
                  <dd>{formatDateTime(project.created_at)}</dd>
                </div>

                <div className="details-item">
                  <dt>Last Updated</dt>
                  <dd>{formatDateTime(project.updated_at)}</dd>
                </div>
              </dl>
            </section>

            <section className="overview-card">
              <div className="overview-card-header">
                <h3 className="overview-card-title">Recent Tasks</h3>
                <button
                  type="button"
                  className="section-link"
                  onClick={() => setActiveTab("tasks")}
                >
                  View all tasks →
                </button>
              </div>

              {tasks.length === 0 ? (
                <p className="text-muted">No tasks in this project yet.</p>
              ) : (
                <div className="overview-tasks-list">
                  {tasks.slice(0, 4).map((t) => (
                    <div
                      key={t.id}
                      className="overview-task-item"
                      onClick={() => setSelectedTask(t)}
                    >
                      <div className="overview-task-info">
                        <span className="overview-task-title">{t.title}</span>
                        <span className="overview-task-date">
                          {t.due_date ? `Due ${formatDate(t.due_date)}` : "No due date"}
                        </span>
                      </div>
                      <span className={`badge status-${t.status.replace("_", "-")}`}>
                        {t.status.replace("_", " ")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* TAB 2: TASKS */}
      {activeTab === "tasks" && (
        <div className="tab-pane">
          <div className="tasks-tab-header">
            <TaskFilters
              filters={taskFilters}
              onChange={(newFilters) => setTaskFilters(newFilters)}
              onReset={() =>
                setTaskFilters({
                  status: null,
                  priority: null,
                  assigneeId: null,
                  sortBy: "created_at",
                  sortOrder: "desc",
                })
              }
              members={members}
              ownerId={project.owner_id}
            />

            {isOwner && (
              <div className="tasks-action-bar">
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => setIsAddTaskOpen(true)}
                >
                  + Add Task
                </button>
              </div>
            )}
          </div>

          {tasksError && (
            <ErrorMessage
              message={tasksError}
              onRetry={() => refetchTasks(tasksPage)}
              onDismiss={() => setTasksError("")}
            />
          )}

          {tasksLoading ? (
            <LoadingSpinner size="large" message="Loading tasks..." />
          ) : tasks.length === 0 ? (
            <EmptyState
              icon="✓"
              title="No tasks found"
              description={
                tasksTotal === 0
                  ? isOwner
                    ? "Start tracking work in this project by creating your first task."
                    : "No tasks have been created in this project yet."
                  : "No tasks match your current filter criteria."
              }
              actionText={isOwner && tasksTotal === 0 ? "+ Add Task" : null}
              onAction={isOwner && tasksTotal === 0 ? () => setIsAddTaskOpen(true) : null}
            />
          ) : (
            <>
              <div className="tasks-grid">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isOwner={isOwner}
                    onOpen={(t) => setSelectedTask(t)}
                    onEdit={(t) => setTaskToEdit(t)}
                    onDelete={(t) => setTaskToDelete(t)}
                  />
                ))}
              </div>

              <Pagination
                currentPage={tasksPage}
                totalPages={tasksTotalPages}
                totalItems={tasksTotal}
                pageSize={tasksPageSize}
                onPageChange={(p) => setTasksPage(p)}
              />
            </>
          )}
        </div>
      )}

      {/* TAB 3: MEMBERS */}
      {activeTab === "members" && (
        <div className="tab-pane">
          {!isOwner ? (
            <div className="info-panel">
              <div className="panel-icon">ℹ️</div>
              <div>
                <h3>Member Management Restricted</h3>
                <p>
                  Only the project owner can view, add, or remove team members. You have access to collaborate on project tasks and comments.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="members-tab-header">
                <div>
                  <h3>Team Members</h3>
                  <p className="text-muted">
                    Manage collaborators who have access to this project
                  </p>
                </div>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => setIsAddMemberOpen(true)}
                >
                  + Add Member
                </button>
              </div>

              {membersError && (
                <ErrorMessage
                  message={membersError}
                  onRetry={refetchMembers}
                  onDismiss={() => setMembersError("")}
                />
              )}

              {membersLoading ? (
                <LoadingSpinner size="large" message="Loading members..." />
              ) : (
                <div className="members-list">
                  <div className="member-card owner-member-card">
                    <div className="member-avatar">👑</div>
                    <div className="member-info">
                      <div className="member-name-row">
                        <span className="member-name">Project Owner</span>
                        <RoleBadge isOwner={true} />
                      </div>
                      <span className="member-uuid">UUID: {project.owner_id}</span>
                    </div>
                  </div>

                  {members.map((member) => (
                    <div key={member.id} className="member-card">
                      <div className="member-avatar">👤</div>
                      <div className="member-info">
                        <div className="member-name-row">
                          <span className="member-name">
                            Member ({shortenUUID(member.user_id)})
                          </span>
                          <RoleBadge role={member.role} />
                        </div>
                        <span className="member-uuid">
                          UUID: {member.user_id}
                        </span>
                        <span className="member-joined">
                          Joined {formatDate(member.joined_at)}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="secondary-button btn-sm btn-danger-outline"
                        onClick={() => setMemberToRemove(member)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  {members.length === 0 && (
                    <div className="empty-members-box">
                      <p>
                        No additional team members added yet. Click <strong>+ Add Member</strong> to invite users by their UUID.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Edit Project Modal */}
      {isEditProjectOpen && (
        <ProjectFormModal
          isOpen={isEditProjectOpen}
          onClose={() => setIsEditProjectOpen(false)}
          onSubmit={handleUpdateProject}
          initialData={project}
        />
      )}

      {/* Delete Project Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteProjectOpen}
        onClose={() => setIsDeleteProjectOpen(false)}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        message={`Are you sure you want to delete "${project.name}"? This will permanently delete all tasks, comments, and member assignments in this project.`}
        confirmText="Delete Project"
        isLoading={deletingProject}
      />

      {/* Add Task Modal */}
      <TaskFormModal
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        onSubmit={handleCreateTask}
        members={members}
        ownerId={project.owner_id}
      />

      {/* Edit Task Modal */}
      {taskToEdit && (
        <TaskFormModal
          isOpen={Boolean(taskToEdit)}
          onClose={() => setTaskToEdit(null)}
          onSubmit={handleUpdateTask}
          initialData={taskToEdit}
          members={members}
          ownerId={project.owner_id}
        />
      )}

      {/* Delete Task Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(taskToDelete)}
        onClose={() => setTaskToDelete(null)}
        onConfirm={() => handleDeleteTask(taskToDelete)}
        title="Delete Task"
        message={`Are you sure you want to delete "${taskToDelete?.title}"?`}
        confirmText="Delete Task"
        isLoading={deletingTask}
      />

      {/* Task Details Modal with Comments */}
      {selectedTask && (
        <TaskDetailModal
          isOpen={Boolean(selectedTask)}
          onClose={() => setSelectedTask(null)}
          task={selectedTask}
          projectName={project.name}
          isOwner={isOwner}
          currentUserId={user?.id}
          projectOwnerId={project.owner_id}
          onEdit={(t) => setTaskToEdit(t)}
          onDelete={(t) => setTaskToDelete(t)}
        />
      )}

      {/* Add Member Modal */}
      <MemberAddModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        onSubmit={handleAddMember}
      />

      {/* Remove Member Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(memberToRemove)}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleRemoveMember}
        title="Remove Member"
        message={`Are you sure you want to remove user "${memberToRemove?.user_id}" from this project?`}
        confirmText="Remove Member"
        isLoading={removingMember}
      />
    </div>
  );
}
