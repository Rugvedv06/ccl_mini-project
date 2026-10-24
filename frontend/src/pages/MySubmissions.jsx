import { Link } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import Spinner from '../components/Spinner';
import ErrorBanner from '../components/ErrorBanner';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../utils/format';

export default function MySubmissions() {
  const { data, loading, error, run } = useAsync(() => apiFetch('/submissions'), []);
  const items = data?.items || [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">My submissions</h1>
          <p className="text-sm text-slate-500">
            Every file you uploaded, its status, marks and feedback. Only you and your lecturer can
            see these records.
          </p>
        </div>
        <Link to="/assignments" className="btn-secondary">
          Browse assignments
        </Link>
      </div>

      <ErrorBanner error={error} onRetry={run} />
      {loading ? <Spinner label="Loading submissions…" /> : null}

      {!loading && !error ? (
        items.length === 0 ? (
          <EmptyState
            title="No submissions yet"
            message="Choose an assignment and upload your first file."
            action={
              <Link to="/assignments" className="btn-primary">
                View assignments
              </Link>
            }
          />
        ) : (
          <div className="card overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th scope="col">Assignment</th>
                  <th scope="col">File</th>
                  <th scope="col">Submitted at</th>
                  <th scope="col">Status</th>
                  <th scope="col">Result</th>
                  <th scope="col" className="text-right">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((submission) => (
                  <tr key={submission.submissionId}>
                    <td className="font-medium text-slate-900">
                      {submission.assignment?.title || submission.assignmentId}
                    </td>
                    <td className="max-w-[14rem] truncate">{submission.fileName || '—'}</td>
                    <td>{formatDate(submission.submittedAt)}</td>
                    <td>
                      <StatusBadge status={submission.status} />
                    </td>
                    <td>
                      {submission.status === 'EVALUATED' ? (
                        <span className="font-semibold text-slate-900">
                          {submission.marks} / {submission.assignment?.maxMarks ?? '—'}
                        </span>
                      ) : (
                        <span className="text-slate-400">Not evaluated</span>
                      )}
                    </td>
                    <td className="text-right">
                      <Link
                        to={`/submissions/${submission.submissionId}`}
                        className="font-medium text-brand-600 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : null}
    </div>
  );
}
