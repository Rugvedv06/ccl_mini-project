import { Link, useParams } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import ErrorBanner from '../components/ErrorBanner';
import StatusBadge from '../components/StatusBadge';
import { formatDate, isPast } from '../utils/format';

export default function AssignmentDetail() {
  const { assignmentId } = useParams();
  const { isFaculty, user } = useAuth();
  const { data, loading, error, run } = useAsync(
    () => apiFetch(`/assignments/${encodeURIComponent(assignmentId)}`),
    [assignmentId],
  );

  if (loading) return <Spinner label="Loading assignment…" />;
  if (error) return <ErrorBanner error={error} onRetry={run} />;
  const assignment = data?.assignment;
  if (!assignment) return <ErrorBanner error="Assignment not found." />;

  const deadline = new Date(assignment.dueDate);
  const overdue = deadline.getTime() < Date.now();
  const isOwner = isFaculty && assignment.createdBy === user?.sub;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/assignments" className="text-sm font-medium text-brand-600 hover:underline">
            ← Back to assignments
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">{assignment.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge kind="assignment" status={assignment.status} />
            {overdue && assignment.status === 'PUBLISHED' ? (
              <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-200">
                Deadline passed
              </span>
            ) : null}
          </div>
        </div>
        {!isFaculty ? (
          <Link
            to={`/assignments/${assignment.assignmentId}/upload`}
            className={overdue ? 'btn-secondary cursor-not-allowed' : 'btn-primary'}
            aria-disabled={overdue}
            onClick={(event) => {
              if (overdue) event.preventDefault();
            }}
          >
            Upload submission
          </Link>
        ) : isOwner ? (
          <div className="flex gap-2">
            <Link to={`/faculty/assignments/${assignment.assignmentId}/edit`} className="btn-secondary">
              Edit
            </Link>
            <Link
              to={`/faculty/assignments/${assignment.assignmentId}/submissions`}
              className="btn-primary"
            >
              Submissions
            </Link>
          </div>
        ) : null}
      </div>

      <section className="card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Description</h2>
        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
          {assignment.description}
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Deadline</p>
          <p className={`mt-1 text-sm font-semibold ${overdue ? 'text-rose-600' : 'text-slate-900'}`}>
            {formatDate(assignment.dueDate)}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Maximum marks</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{assignment.maxMarks}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Accepted files</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {(assignment.allowedFileTypes || []).map((t) => `.${t}`).join(', ') || '—'}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Released</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(assignment.createdAt)}</p>
        </div>
      </section>

      {!isFaculty && overdue ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          The deadline for this assignment has passed. The server rejects new uploads after the
          deadline.
        </p>
      ) : null}
    </div>
  );
}
