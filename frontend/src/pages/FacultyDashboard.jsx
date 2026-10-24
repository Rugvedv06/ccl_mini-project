import { Link } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import Spinner from '../components/Spinner';
import ErrorBanner from '../components/ErrorBanner';
import EmptyState from '../components/EmptyState';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../utils/format';

export default function FacultyDashboard() {
  const { data, loading, error, run } = useAsync(async () => {
    const [assignments, pending, evaluated] = await Promise.all([
      apiFetch('/assignments'),
      apiFetch('/submissions?status=SUBMITTED'),
      apiFetch('/submissions?status=EVALUATED'),
    ]);
    return {
      assignments: assignments.items || [],
      pending: pending.items || [],
      evaluated: evaluated.items || [],
    };
  }, []);

  if (loading) return <Spinner label="Loading faculty dashboard…" />;
  if (error) return <ErrorBanner error={error} onRetry={run} />;

  const published = data.assignments.filter((a) => a.status === 'PUBLISHED');
  const drafts = data.assignments.filter((a) => a.status === 'DRAFT');
  const avgScore =
    data.evaluated.length > 0
      ? (
          data.evaluated.reduce((sum, s) => sum + (Number(s.marks) || 0), 0) / data.evaluated.length
        ).toFixed(1)
      : '—';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Faculty dashboard</h1>
          <p className="text-sm text-slate-500">
            Manage assignments, review submissions and publish evaluations.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/faculty/evaluations" className="btn-secondary">
            Evaluation queue
          </Link>
          <Link to="/faculty/assignments/new" className="btn-primary">
            Create assignment
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="My assignments" value={data.assignments.length} accent="brand" />
        <StatCard label="Published" value={published.length} hint={`${drafts.length} draft(s)`} accent="emerald" />
        <StatCard label="Pending evaluations" value={data.pending.length} accent="amber" />
        <StatCard label="Average awarded" value={avgScore} hint={`${data.evaluated.length} evaluated`} accent="slate" />
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Pending evaluations</h2>
          <Link to="/faculty/evaluations" className="text-sm font-medium text-brand-600 hover:underline">
            View all
          </Link>
        </div>
        {data.pending.length === 0 ? (
          <EmptyState title="Nothing to evaluate" message="New submissions will appear here as soon as students upload them." />
        ) : (
          <div className="card overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th scope="col">Assignment</th>
                  <th scope="col">File</th>
                  <th scope="col">Submitted</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.pending.slice(0, 8).map((submission) => (
                  <tr key={submission.submissionId}>
                    <td className="font-medium text-slate-900">
                      {submission.assignment?.title || submission.assignmentId}
                    </td>
                    <td className="max-w-[14rem] truncate">{submission.fileName || '—'}</td>
                    <td>{formatDate(submission.submittedAt)}</td>
                    <td><StatusBadge status={submission.status} /></td>
                    <td className="text-right">
                      <Link
                        to={`/faculty/submissions/${submission.submissionId}/evaluate`}
                        className="font-medium text-brand-600 hover:underline"
                      >
                        Evaluate
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">My assignments</h2>
        {data.assignments.length === 0 ? (
          <EmptyState
            title="No assignments yet"
            message="Create your first assignment; it stays private as a draft until you publish it."
            action={
              <Link to="/faculty/assignments/new" className="btn-primary">
                Create assignment
              </Link>
            }
          />
        ) : (
          <div className="card divide-y divide-slate-100">
            {data.assignments.slice(0, 6).map((assignment) => (
              <div
                key={assignment.assignmentId}
                className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-slate-900">{assignment.title}</p>
                  <p className="text-xs text-slate-500">
                    Deadline {formatDate(assignment.dueDate)} · {assignment.maxMarks} marks
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge kind="assignment" status={assignment.status} />
                  <Link
                    to={`/faculty/assignments/${assignment.assignmentId}/submissions`}
                    className="text-sm font-medium text-brand-600 hover:underline"
                  >
                    Submissions
                  </Link>
                  <Link
                    to={`/faculty/assignments/${assignment.assignmentId}/edit`}
                    className="text-sm font-medium text-slate-600 hover:underline"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
