import { useCallback, useEffect, useState } from "react";
import {
  getComments,
  createComment,
  deleteComment,
} from "../../api/comments";
import ConfirmDialog from "../common/ConfirmDialog";
import LoadingSpinner from "../common/LoadingSpinner";
import ErrorMessage from "../common/ErrorMessage";
import {
  formatDateTime,
  formatRelativeTime,
  getApiErrorMessage,
  shortenUUID,
} from "../../utils/formatters";

export function CommentSection({
  projectId,
  taskId,
  currentUserId,
  projectOwnerId,
}) {
  const [comments, setComments] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalComments, setTotalComments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [commentToDelete, setCommentToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchComments = useCallback(
    async (targetPage = 1, append = false) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError("");

      try {
        const data = await getComments(projectId, taskId, {
          page: targetPage,
          pageSize: 20,
        });

        if (append) {
          setComments((prev) => [...prev, ...data.items]);
        } else {
          setComments(data.items);
        }
        setPage(data.page);
        setTotalPages(data.total_pages);
        setTotalComments(data.total);
      } catch (err) {
        setError(getApiErrorMessage(err, "Failed to load comments."));
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [projectId, taskId]
  );

  useEffect(() => {
    let active = true;

    async function loadInitialComments() {
      try {
        const data = await getComments(projectId, taskId, {
          page: 1,
          pageSize: 20,
        });

        if (active) {
          setComments(data.items || []);
          setPage(data.page || 1);
          setTotalPages(data.total_pages || 1);
          setTotalComments(data.total || 0);
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          setError(getApiErrorMessage(err, "Failed to load comments."));
          setLoading(false);
        }
      }
    }

    loadInitialComments();

    return () => {
      active = false;
    };
  }, [projectId, taskId]);

  async function handleAddComment(e) {
    e.preventDefault();
    setSubmitError("");

    const trimmed = newComment.trim();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      await createComment(projectId, taskId, { content: trimmed });
      setNewComment("");
      await fetchComments(1, false);
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, "Failed to post comment."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!commentToDelete) return;

    setDeleting(true);
    try {
      await deleteComment(projectId, taskId, commentToDelete.id);
      setComments((prev) => prev.filter((c) => c.id !== commentToDelete.id));
      setTotalComments((prev) => Math.max(0, prev - 1));
      setCommentToDelete(null);
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, "Failed to delete comment."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="comments-section" aria-label="Task Comments">
      <div className="comments-header">
        <h4 className="comments-title">
          Comments ({totalComments})
        </h4>
      </div>

      <form onSubmit={handleAddComment} className="comment-form">
        <div className="form-field">
          <textarea
            rows={3}
            placeholder="Write a comment or update... (plain text supported)"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            maxLength={5000}
            disabled={submitting}
            required
          />
        </div>

        {submitError && (
          <div className="error-message" role="alert">
            {submitError}
          </div>
        )}

        <div className="comment-form-actions">
          <span className="field-hint">
            {newComment.length} / 5000 characters
          </span>
          <button
            type="submit"
            className="primary-button btn-sm comment-submit-btn"
            disabled={submitting || !newComment.trim()}
          >
            {submitting ? "Posting..." : "Post Comment"}
          </button>
        </div>
      </form>

      {loading ? (
        <LoadingSpinner size="small" message="Loading comments..." />
      ) : error ? (
        <ErrorMessage
          message={error}
          onRetry={() => fetchComments(1, false)}
        />
      ) : comments.length === 0 ? (
        <div className="comments-empty">
          <p>No comments yet. Be the first to start the discussion!</p>
        </div>
      ) : (
        <div className="comments-list">
          {comments.map((comment) => {
            const isAuthor = comment.author_id === currentUserId;
            const canDelete =
              isAuthor || projectOwnerId === currentUserId;

            return (
              <article key={comment.id} className="comment-card">
                <div className="comment-card-header">
                  <div className="comment-author-info">
                    <div className="comment-avatar">
                      {isAuthor ? "You" : "👤"}
                    </div>
                    <div>
                      <span className="comment-author-name">
                        {isAuthor
                          ? "You"
                          : `User ${shortenUUID(comment.author_id)}`}
                      </span>
                      <time
                        className="comment-timestamp"
                        dateTime={comment.created_at}
                        title={formatDateTime(comment.created_at)}
                      >
                        {formatRelativeTime(comment.created_at)}
                      </time>
                    </div>
                  </div>

                  {canDelete && (
                    <button
                      type="button"
                      className="icon-button icon-button-danger comment-delete-btn"
                      onClick={() => setCommentToDelete(comment)}
                      title="Delete comment"
                      aria-label="Delete comment"
                    >
                      🗑
                    </button>
                  )}
                </div>

                <div className="comment-content">
                  <p>{comment.content}</p>
                </div>
              </article>
            );
          })}

          {page < totalPages && (
            <div className="comments-load-more">
              <button
                type="button"
                className="secondary-button btn-sm"
                onClick={() => fetchComments(page + 1, true)}
                disabled={loadingMore}
              >
                {loadingMore ? "Loading..." : "Load more comments"}
              </button>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(commentToDelete)}
        onClose={() => setCommentToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete Comment"
        isLoading={deleting}
      />
    </section>
  );
}

export default CommentSection;
