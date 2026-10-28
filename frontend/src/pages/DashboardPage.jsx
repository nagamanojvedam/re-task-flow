import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/useAuth";
import { getProjects, createProject } from "../api/projects";
import { getTasks } from "../api/tasks";
import ProjectCard from "../components/projects/ProjectCard";
import ProjectFormModal from "../components/projects/ProjectFormModal";
import TaskCard from "../components/tasks/TaskCard";
import TaskDetailModal from "../components/tasks/TaskDetailModal";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorMessage from "../components/common/ErrorMessage";
import EmptyState from "../components/common/EmptyState";
import { getApiErrorMessage, shortenUUID } from "../utils/formatters";

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [projects, setProjects] = useState([]);
  const [totalProjects, setTotalProjects] = useState(0);

  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    totalTasks: 0,
    todoTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
  });

  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const projectsData = await getProjects({ page: 1, pageSize: 10 });
      const fetchedProjects = projectsData.items || [];
      setProjects(fetchedProjects);
      setTotalProjects(projectsData.total || 0);

      if (fetchedProjects.length > 0) {
        const topProjects = fetchedProjects.slice(0, 5);
        const taskPromises = topProjects.map(async (p) => {
          try {
            const res = await getTasks(p.id, {
              page: 1,
              pageSize: 10,
              sortBy: "created_at",
              sortOrder: "desc",
            });
            return (res.items || []).map((t) => ({
              ...t,
              projectName: p.name,
              projectOwnerId: p.owner_id,
            }));
          } catch {
            return [];
          }
        });

        const projectTaskArrays = await Promise.all(taskPromises);
        const allFetchedTasks = projectTaskArrays.flat();

        let todo = 0;
        let inProg = 0;
        let completed = 0;

        allFetchedTasks.forEach((t) => {
          if (t.status === "completed") completed++;
          else if (t.status === "in_progress") inProg++;
          else todo++;
        });

        setStats({
          totalTasks: allFetchedTasks.length,
          todoTasks: todo,
          inProgressTasks: inProg,
          completedTasks: completed,
        });

        allFetchedTasks.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setTasks(allFetchedTasks.slice(0, 6));
      } else {
        setTasks([]);
        setStats({
          totalTasks: 0,
          todoTasks: 0,
          inProgressTasks: 0,
          completedTasks: 0,
        });
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load dashboard data."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function initialLoad() {
      try {
        const projectsData = await getProjects({ page: 1, pageSize: 10 });
        const fetchedProjects = projectsData.items || [];

        let calculatedTasks = [];
        let todo = 0;
        let inProg = 0;
        let completed = 0;

        if (fetchedProjects.length > 0) {
          const topProjects = fetchedProjects.slice(0, 5);
          const taskPromises = topProjects.map(async (p) => {
            try {
              const res = await getTasks(p.id, {
                page: 1,
                pageSize: 10,
                sortBy: "created_at",
                sortOrder: "desc",
              });
              return (res.items || []).map((t) => ({
                ...t,
                projectName: p.name,
                projectOwnerId: p.owner_id,
              }));
            } catch {
              return [];
            }
          });

          const projectTaskArrays = await Promise.all(taskPromises);
          calculatedTasks = projectTaskArrays.flat();

          calculatedTasks.forEach((t) => {
            if (t.status === "completed") completed++;
            else if (t.status === "in_progress") inProg++;
            else todo++;
          });

          calculatedTasks.sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        }

        if (active) {
          setProjects(fetchedProjects);
          setTotalProjects(projectsData.total || 0);
          setTasks(calculatedTasks.slice(0, 6));
          setStats({
            totalTasks: calculatedTasks.length,
            todoTasks: todo,
            inProgressTasks: inProg,
            completedTasks: completed,
          });
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          setError(getApiErrorMessage(err, "Failed to load dashboard data."));
          setLoading(false);
        }
      }
    }

    initialLoad();

    return () => {
      active = false;
    };
  }, []);

  async function handleCreateProject(data) {
    const newProj = await createProject(data);
    setIsCreateProjectOpen(false);
    await loadDashboardData();
    navigate(`/projects/${newProj.id}`);
  }

  function handleCopyUserId() {
    if (!user?.id) return;
    navigator.clipboard.writeText(user.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  }

  if (loading) {
    return (
      <div className="dashboard-page-container">
        <LoadingSpinner size="large" message="Loading your workspace..." />
      </div>
    );
  }

  return (
    <div className="dashboard-page-container">
      {/* Welcome Banner */}
      <section className="welcome-banner">
        <div className="welcome-content">
          <p className="eyebrow">WORKSPACE OVERVIEW</p>
          <h1 className="welcome-title">
            Welcome back, {user?.full_name?.split(" ")[0] || "there"} 👋
          </h1>
          <p className="welcome-description">
            Here is a snapshot of your projects, active tasks, and team progress.
          </p>

          <div className="welcome-actions">
            <button
              type="button"
              className="primary-button btn-inline"
              onClick={() => setIsCreateProjectOpen(true)}
            >
              + Create Project
            </button>
            <Link to="/tasks" className="secondary-button btn-inline">
              View All Tasks →
            </Link>
          </div>
        </div>

        <div className="welcome-user-card">
          <div className="user-card-header">
            <div className="user-card-avatar">
              {user?.full_name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <div className="user-card-name">{user?.full_name}</div>
              <div className="user-card-email">{user?.email}</div>
            </div>
          </div>
          <div className="user-card-id-row">
            <span className="user-card-id-label">Your UUID:</span>
            <code className="user-card-id-code" title={user?.id}>
              {shortenUUID(user?.id)}
            </code>
            <button
              type="button"
              className="copy-pill-btn"
              onClick={handleCopyUserId}
              title="Copy UUID to give to team members who want to add you to their projects"
            >
              {copiedId ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      </section>

      {error && (
        <ErrorMessage
          message={error}
          onRetry={loadDashboardData}
          onDismiss={() => setError("")}
        />
      )}

      {/* Summary Cards */}
      <section className="stats-grid" aria-label="Summary Statistics">
        <div className="stat-card">
          <div className="stat-icon stat-icon-projects">📁</div>
          <div className="stat-content">
            <span className="stat-label">Accessible Projects</span>
            <span className="stat-value">{totalProjects}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-tasks">✓</div>
          <div className="stat-content">
            <span className="stat-label">Active Tasks</span>
            <span className="stat-value">{stats.totalTasks}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-progress">⏳</div>
          <div className="stat-content">
            <span className="stat-label">In Progress</span>
            <span className="stat-value">{stats.inProgressTasks}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-completed">🎉</div>
          <div className="stat-content">
            <span className="stat-label">Completed</span>
            <span className="stat-value">{stats.completedTasks}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-todo">📋</div>
          <div className="stat-content">
            <span className="stat-label">To Do</span>
            <span className="stat-value">{stats.todoTasks}</span>
          </div>
        </div>
      </section>

      {/* Main Dashboard Grid */}
      <div className="dashboard-sections-grid">
        {/* Recent Projects Section */}
        <section className="dashboard-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">Recent Projects</h2>
              <p className="section-subtitle">
                Projects you own or participate in
              </p>
            </div>
            <Link to="/projects" className="section-link">
              View all ({totalProjects}) →
            </Link>
          </div>

          {projects.length === 0 ? (
            <EmptyState
              icon="📁"
              title="No projects yet"
              description="Create your first project to start organizing your work and tracking tasks."
              actionText="+ Create Project"
              onAction={() => setIsCreateProjectOpen(true)}
            />
          ) : (
            <div className="dashboard-projects-list">
              {projects.slice(0, 4).map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  currentUserId={user?.id}
                />
              ))}
            </div>
          )}
        </section>

        {/* Recent Tasks Section */}
        <section className="dashboard-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">Recent Tasks</h2>
              <p className="section-subtitle">
                Latest updates across your active projects
              </p>
            </div>
            <Link to="/tasks" className="section-link">
              View all tasks →
            </Link>
          </div>

          {tasks.length === 0 ? (
            <EmptyState
              icon="📝"
              title="No tasks yet"
              description={
                totalProjects === 0
                  ? "Create a project to start adding tasks."
                  : "Add tasks to your projects to start tracking progress."
              }
              actionText={totalProjects === 0 ? "+ Create Project" : "Go to Projects"}
              onAction={() => {
                if (totalProjects === 0) {
                  setIsCreateProjectOpen(true);
                } else {
                  navigate("/projects");
                }
              }}
            />
          ) : (
            <div className="dashboard-tasks-list">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  projectName={task.projectName}
                  onOpen={(t) => setSelectedTask(t)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Project Form Modal */}
      <ProjectFormModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onSubmit={handleCreateProject}
      />

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          isOpen={Boolean(selectedTask)}
          onClose={() => setSelectedTask(null)}
          task={selectedTask}
          projectName={selectedTask.projectName}
          isOwner={selectedTask.projectOwnerId === user?.id}
          currentUserId={user?.id}
          projectOwnerId={selectedTask.projectOwnerId}
        />
      )}
    </div>
  );
}
