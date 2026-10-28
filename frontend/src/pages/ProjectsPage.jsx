import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/useAuth";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../api/projects";
import PageHeader from "../components/layout/PageHeader";
import ProjectCard from "../components/projects/ProjectCard";
import ProjectFormModal from "../components/projects/ProjectFormModal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Pagination from "../components/common/Pagination";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorMessage from "../components/common/ErrorMessage";
import EmptyState from "../components/common/EmptyState";
import { getApiErrorMessage } from "../utils/formatters";

export default function ProjectsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProjects = useCallback(
    async (targetPage = 1) => {
      setLoading(true);
      setError("");

      try {
        const data = await getProjects({
          page: targetPage,
          pageSize,
        });

        setProjects(data.items || []);
        setPage(data.page || 1);
        setTotal(data.total || 0);
        setTotalPages(data.total_pages || 1);
      } catch (err) {
        setError(getApiErrorMessage(err, "Failed to load projects."));
      } finally {
        setLoading(false);
      }
    },
    [pageSize]
  );

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await getProjects({
          page,
          pageSize,
        });

        if (active) {
          setProjects(data.items || []);
          setTotal(data.total || 0);
          setTotalPages(data.total_pages || 1);
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          setError(getApiErrorMessage(err, "Failed to load projects."));
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [page, pageSize]);

  async function handleCreateProject(data) {
    const created = await createProject(data);
    setIsCreateOpen(false);
    setSuccessMessage(`Project "${created.name}" created successfully.`);
    setTimeout(() => setSuccessMessage(""), 4000);
    navigate(`/projects/${created.id}`);
  }

  async function handleUpdateProject(data) {
    if (!projectToEdit) return;
    const updated = await updateProject(projectToEdit.id, data);
    setProjectToEdit(null);
    setSuccessMessage(`Project "${updated.name}" updated successfully.`);
    setTimeout(() => setSuccessMessage(""), 4000);
    await fetchProjects(page);
  }

  async function handleDeleteProject() {
    if (!projectToDelete) return;
    setDeleting(true);
    try {
      await deleteProject(projectToDelete.id);
      setSuccessMessage(`Project "${projectToDelete.name}" was deleted.`);
      setTimeout(() => setSuccessMessage(""), 4000);
      setProjectToDelete(null);

      if (projects.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        await fetchProjects(page);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to delete project."));
    } finally {
      setDeleting(false);
    }
  }

  const filteredProjects = projects.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="page-container">
      <PageHeader
        title="Projects"
        description="View and manage all projects you own or have been added to."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Projects" },
        ]}
        actions={
          <button
            type="button"
            className="primary-button"
            onClick={() => setIsCreateOpen(true)}
          >
            + New Project
          </button>
        }
      />

      {successMessage && (
        <div className="success-banner" role="status">
          ✓ {successMessage}
        </div>
      )}

      {error && (
        <ErrorMessage
          message={error}
          onRetry={() => fetchProjects(page)}
          onDismiss={() => setError("")}
        />
      )}

      {/* Search and stats bar */}
      <div className="filter-search-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="search"
            placeholder="Search projects by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            disabled={loading}
          />
        </div>
        <div className="filter-count">
          {total} accessible {total === 1 ? "project" : "projects"}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner size="large" message="Loading projects..." />
      ) : projects.length === 0 ? (
        <EmptyState
          icon="📁"
          title="No projects found"
          description="You haven't created any projects yet, and haven't been added to any team projects."
          actionText="+ Create Project"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No matching projects"
          description={`No projects found matching "${searchQuery}".`}
          actionText="Clear Search"
          onAction={() => setSearchQuery("")}
        />
      ) : (
        <>
          <div className="projects-grid">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                currentUserId={user?.id}
                onEdit={(p) => setProjectToEdit(p)}
                onDelete={(p) => setProjectToDelete(p)}
              />
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            pageSize={pageSize}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </>
      )}

      {/* Create Project Modal */}
      <ProjectFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateProject}
      />

      {/* Edit Project Modal */}
      {projectToEdit && (
        <ProjectFormModal
          isOpen={Boolean(projectToEdit)}
          onClose={() => setProjectToEdit(null)}
          onSubmit={handleUpdateProject}
          initialData={projectToEdit}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(projectToDelete)}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        message={`Are you sure you want to delete "${projectToDelete?.name}"? All tasks and comments inside this project will be permanently deleted. This action cannot be undone.`}
        confirmText="Delete Project"
        isLoading={deleting}
      />
    </div>
  );
}
