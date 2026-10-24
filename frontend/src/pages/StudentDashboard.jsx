import { Link } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import Spinner from '../components/Spinner';
import ErrorBanner from '../components/ErrorBanner';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import StatCard from '../components/StatCard';
import { formatDate, isPast } from '../utils/format';

export default function StudentDashboard() {
  const { data, loading, error, run } = useAsync(async () => {
    const [assignments, submissions] = await Promise.all([
      apiFetch('/assignments'),
      apiFetch('/submissions'),
    ]);
    return { assignments: assignments.items || [], submissions: submissions.items || [] };
  }, []);

  if (loading) return <Spinner label="Loading your dashboard…" />;
  if (error) return <ErrorBanner error={error} onRetry={run} />;

  const active = data.assignments.filter((a) => !isPast(a.dueDate));
  const submittedIds = new Set(
    data.submissions
      .filter((s) => s.status !== 'PENDING_UPLOAD' && s.status !== 'EXPIRED')
      .map((s) => s.assignmentId),
  );
  const awaiting = data.submissions.filter((s) => s.status === 'SUBMITTED');
  const evaluated = data.submissions.filter((s) => s.status === 'EVALUATED');
  const notYetSubmitted = active.filter((a) => !submittedIds.has(a.assignmentId));
  const avg =
    evaluated.length > 0
      ? (
          evaluated.reduce((sum, s) => sum + (Number(s.marks) || 0), 0) / evaluated.length
        ).toFixed(1)
      : '—';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Student dashboard</h1>
          <p className="text-sm text-slate-500">Track assignments, uploads and your results.</p>
        </div>
        <Link to="/assignments" className="btn-primary">
          Browse assignments
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active assignments" value={active.length} accent="brand" />
        <StatCard label="Not yet submitted" value={notYetSubmitted.length} accent="amber" />
        <StatCard label="Awaiting evaluation" value={awaiting.length} accent="slate" />
        <StatCard label="Average marks" value={avg} hint={`${evaluated.length} evaluated`} accent="emerald" />
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Open assignments</h2>
          <Link to="/assignments" className="text-sm font-medium text-brand-600 hover:underline">
            View all
          </Link>
        </div>
        {notYetSubmitted.length === 0 ? (
          <EmptyState
            title="No pending assignments"
            message="Every open assignment has a submission from you. Check My submissions for results."
          />
        ) : (
          <div className="card divide-y divide-slate-100">
            {notYetSubmitted.slice(0, 5).map((assignment) => (
              <Link
                key={assignment.assignmentId}
                to={`/assignments/${assignment.assignmentId}`}
                className="flex flex-col gap-1 px-5 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-slate-900">{assignment.title}</p>
                  <p className="text-xs text-slate-500">
                    Deadline {formatDate(assignment.dueDate)} · {assignment.maxMarks} marks
                  </p>
                </div>
                <span className="text-sm font-medium text-brand-600">Open →</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Recent submissions</h2>
          <Link to="/submissions" className="text-sm font-medium text-brand-600 hover:underline">
            My submissions
          </Link>
        </div>
        {data.submissions.length === 0 ? (
          <EmptyState
            title="No submissions yet"
            message="Upload a file for an assignment and it will appear here with its status."
          />
        ) : (
          <div className="card overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th scope="col">Assignment</th>
                  <th scope="col">File</th>
                  <th scope="col">Status</th>
                  <th scope="col">Marks</th>
                  <th scope="col">Updated</th>
                </tr>
              </thead>
              <tbody>
                {data.submissions.slice(0, 6).map((submission) => (
                  <tr key={submission.submissionId}>
                    <td>
                      <Link
                        to={`/submissions/${submission.submissionId}`}
                        className="font-medium text-brand-600 hover:underline"
                      >
                        {submission.assignment?.title || submission.assignmentId}
                      </Link>
                    </td>
                    <td className="max-w-[12rem] truncate">{submission.fileName || '—'}</td>
                    <td>
                      <StatusBadge status={submission.status} />
                    </td>
                    <td>
                      {submission.status === 'EVALUATED'
                        ? `${submission.marks} / ${submission.assignment?.maxMarks ?? '—'}`
                        : '—'}
                    </td>
                    <td>{formatDate(submission.updatedAt || submission.submittedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
