import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/useAuth";
import { getProjects } from "../api/projects";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from "../api/tasks";
import { getProjectMembers } from "../api/projectMembers";
import PageHeader from "../components/layout/PageHeader";
import TaskCard from "../components/tasks/TaskCard";
import TaskFilters from "../components/tasks/TaskFilters";
import TaskFormModal from "../components/tasks/TaskFormModal";
import TaskDetailModal from "../components/tasks/TaskDetailModal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Pagination from "../components/common/Pagination";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorMessage from "../components/common/ErrorMessage";
import EmptyState from "../components/common/EmptyState";
import { getApiErrorMessage } from "../utils/formatters";

export default function TasksPage() {
  const { user } = useAuth();

  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const [members, setMembers] = useState([]);

  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [filters, setFilters] = useState({
    status: null,
    priority: null,
    assigneeId: null,
    sortBy: "created_at",
    sortOrder: "desc",
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const isOwner = selectedProject && user ? selectedProject.owner_id === user.id : false;

  // 1. Initial Projects Fetch
  useEffect(() => {
    let active = true;

    async function loadProjects() {
      try {
        const res = await getProjects({ page: 1, pageSize: 50 });
        const items = res.items || [];
        if (active) {
          setProjects(items);
          if (items.length > 0) {
            setSelectedProjectId(items[0].id);
          }
          setProjectsLoading(false);
        }
      } catch (err) {
        if (active) {
          setTasksError(getApiErrorMessage(err, "Failed to load projects."));
          setProjectsLoading(false);
        }
      }
    }

    loadProjects();

    return () => {
      active = false;
    };
  }, []);

  // 2. Members of selected project if owner
  useEffect(() => {
    if (!selectedProjectId || !isOwner) {
      return;
    }

    let active = true;

    async function loadMembers() {
      try {
        const data = await getProjectMembers(selectedProjectId);
        if (active) {
          setMembers(data || []);
        }
      } catch {
        if (active) {
          setMembers([]);
        }
      }
    }

    loadMembers();

    return () => {
      active = false;
    };
  }, [selectedProjectId, isOwner]);

  // 3. Tasks Fetch
  useEffect(() => {
    if (!selectedProjectId) {
      return;
    }

    let active = true;

    async function load() {
      try {
        const data = await getTasks(selectedProjectId, {
          page,
          pageSize,
          status: filters.status,
          priority: filters.priority,
          assigneeId: filters.assigneeId,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
        });

        if (active) {
          setTasks(data.items || []);
          setTotal(data.total || 0);
          setTotalPages(data.total_pages || 1);
          setTasksLoading(false);
        }
      } catch (err) {
        if (active) {
          setTasksError(getApiErrorMessage(err, "Failed to load tasks."));
          setTasksLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [selectedProjectId, page, pageSize, filters]);

  // Refetch helper for mutations and manual retries
  const refetchTasks = useCallback(
    async (targetPage = 1) => {
      if (!selectedProjectId) return;
      setTasksLoading(true);
      setTasksError("");

      try {
        const data = await getTasks(selectedProjectId, {
          page: targetPage,
          pageSize,
          status: filters.status,
          priority: filters.priority,
          assigneeId: filters.assigneeId,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
        });

        setTasks(data.items || []);
        setPage(data.page || 1);
        setTotal(data.total || 0);
        setTotalPages(data.total_pages || 1);
      } catch (err) {
        setTasksError(getApiErrorMessage(err, "Failed to load tasks."));
      } finally {
        setTasksLoading(false);
      }
    },
    [selectedProjectId, pageSize, filters]
  );

  async function handleCreateTask(data) {
    if (!selectedProjectId) return;
    await createTask(selectedProjectId, data);
    setIsCreateOpen(false);
    setFeedbackMessage("Task created successfully.");
    setTimeout(() => setFeedbackMessage(""), 4000);
    await refetchTasks(1);
  }

  async function handleUpdateTask(data) {
    if (!selectedProjectId || !taskToEdit) return;
    await updateTask(selectedProjectId, taskToEdit.id, data);
    setTaskToEdit(null);
    setFeedbackMessage("Task updated successfully.");
    setTimeout(() => setFeedbackMessage(""), 4000);
    await refetchTasks(page);
  }

  async function handleDeleteTask(task) {
    if (!selectedProjectId) return;
    setDeleting(true);
    try {
      await deleteTask(selectedProjectId, task.id);
      setTaskToDelete(null);
      setFeedbackMessage("Task deleted successfully.");
      setTimeout(() => setFeedbackMessage(""), 4000);
      await refetchTasks(page);
    } catch (err) {
      setTasksError(getApiErrorMessage(err, "Failed to delete task."));
    } finally {
      setDeleting(false);
    }
  }

  const effectiveTasks = selectedProjectId ? tasks : [];
  const effectiveMembers = selectedProjectId && isOwner ? members : [];

  return (
    <div className="page-container">
      <PageHeader
        title="Tasks"
        description="Browse, filter, and manage tasks across your projects."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Tasks" },
        ]}
        actions={
          isOwner ? (
            <button
              type="button"
              className="primary-button"
              onClick={() => setIsCreateOpen(true)}
            >
              + New Task
            </button>
          ) : null
        }
      />

      {feedbackMessage && (
        <div className="success-banner" role="status">
          ✓ {feedbackMessage}
        </div>
      )}

      {tasksError && (
        <ErrorMessage
          message={tasksError}
          onRetry={() => refetchTasks(page)}
          onDismiss={() => setTasksError("")}
        />
      )}

      {/* Project Selector Bar */}
      <div className="tasks-project-selector-card">
        <div className="project-select-group">
          <label htmlFor="tasks-project-select">
            <strong>Select Project:</strong>
          </label>
          {projectsLoading ? (
            <span className="text-muted">Loading projects...</span>
          ) : projects.length === 0 ? (
            <span className="text-muted">No projects found.</span>
          ) : (
            <select
              id="tasks-project-select"
              value={selectedProjectId}
              onChange={(e) => {
                const nextId = e.target.value;
                setSelectedProjectId(nextId);
                setPage(1);
                setTasks([]);
                setMembers([]);
                setTasksLoading(true);
              }}
              className="project-select"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  📁 {p.name} {p.owner_id === user?.id ? "(Owner)" : "(Member)"}
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedProject && (
          <div className="project-meta-badge">
            <span className="text-muted">Role:</span>{" "}
            <strong>{isOwner ? "Owner" : "Member"}</strong>
          </div>
        )}
      </div>

      {projects.length === 0 && !projectsLoading ? (
        <EmptyState
          icon="📁"
          title="No Projects Found"
          description="Tasks are organized within projects. Create or join a project to view and manage tasks."
          actionText="Go to Projects"
          onAction={() => (window.location.href = "/projects")}
        />
      ) : (
        <>
          {/* Filters */}
          <TaskFilters
            filters={filters}
            onChange={(newFilters) => setFilters(newFilters)}
            onReset={() =>
              setFilters({
                status: null,
                priority: null,
                assigneeId: null,
                sortBy: "created_at",
                sortOrder: "desc",
              })
            }
            members={effectiveMembers}
            ownerId={selectedProject?.owner_id}
          />

          {tasksLoading ? (
            <LoadingSpinner size="large" message="Loading tasks..." />
          ) : effectiveTasks.length === 0 ? (
            <EmptyState
              icon="✓"
              title="No Tasks Found"
              description={
                total === 0
                  ? isOwner
                    ? "Get started by creating your first task in this project."
                    : "There are currently no tasks in this project."
                  : "No tasks match your selected filter criteria."
              }
              actionText={isOwner && total === 0 ? "+ New Task" : null}
              onAction={isOwner && total === 0 ? () => setIsCreateOpen(true) : null}
            />
          ) : (
            <>
              <div className="tasks-grid">
                {effectiveTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    projectName={selectedProject?.name}
                    isOwner={isOwner}
                    onOpen={(t) => setSelectedTask(t)}
                    onEdit={(t) => setTaskToEdit(t)}
                    onDelete={(t) => setTaskToDelete(t)}
                  />
                ))}
              </div>

              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
                pageSize={pageSize}
                onPageChange={(p) => setPage(p)}
              />
            </>
          )}
        </>
      )}

      {/* Create Task Modal */}
      {selectedProjectId && (
        <TaskFormModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreateTask}
          members={effectiveMembers}
          ownerId={selectedProject?.owner_id}
        />
      )}

      {/* Edit Task Modal */}
      {taskToEdit && (
        <TaskFormModal
          isOpen={Boolean(taskToEdit)}
          onClose={() => setTaskToEdit(null)}
          onSubmit={handleUpdateTask}
          initialData={taskToEdit}
          members={effectiveMembers}
          ownerId={selectedProject?.owner_id}
        />
      )}

      {/* Delete Task Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(taskToDelete)}
        onClose={() => setTaskToDelete(null)}
        onConfirm={() => handleDeleteTask(taskToDelete)}
        title="Delete Task"
        message={`Are you sure you want to delete "${taskToDelete?.title}"? This cannot be undone.`}
        confirmText="Delete Task"
        isLoading={deleting}
      />

      {/* Task Detail Modal with Comments */}
      {selectedTask && (
        <TaskDetailModal
          isOpen={Boolean(selectedTask)}
          onClose={() => setSelectedTask(null)}
          task={selectedTask}
          projectName={selectedProject?.name}
          isOwner={isOwner}
          currentUserId={user?.id}
          projectOwnerId={selectedProject?.owner_id}
          onEdit={(t) => setTaskToEdit(t)}
          onDelete={(t) => setTaskToDelete(t)}
        />
      )}
    </div>
  );
}
