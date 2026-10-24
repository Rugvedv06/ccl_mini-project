import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import Spinner from '../components/Spinner';
import ErrorBanner from '../components/ErrorBanner';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../utils/format';

export default function SubmissionManagement() {
  const { assignmentId } = useParams();
  const [tab, setTab] = useState('ALL');
  const [downloadError, setDownloadError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const { data, loading, error, run } = useAsync(async () => {
    const [assignment, submissions] = await Promise.all([
      apiFetch(`/assignments/${encodeURIComponent(assignmentId)}`),
      apiFetch(`/submissions?assignmentId=${encodeURIComponent(assignmentId)}`),
    ]);
    return { assignment: assignment.assignment, items: submissions.items || [] };
  }, [assignmentId]);

  const items = useMemo(() => {
    const all = data?.items || [];
    if (tab === 'ALL') return all;
    if (tab === 'PENDING') return all.filter((s) => s.status === 'SUBMITTED');
    if (tab === 'EVALUATED') return all.filter((s) => s.status === 'EVALUATED');
    if (tab === 'INCOMPLETE') return all.filter((s) => s.status !== 'SUBMITTED' && s.status !== 'EVALUATED');
    return all;
  }, [data, tab]);

  if (loading) return <Spinner label="Loading submissions…" />;
  if (error) return <ErrorBanner error={error} onRetry={run} />;
  if (!data?.assignment) return <ErrorBanner error="Assignment not found." />;

  const assignment = data.assignment;
  const counts = {
    ALL: data.items.length,
    PENDING: data.items.filter((s) => s.status === 'SUBMITTED').length,
    EVALUATED: data.items.filter((s) => s.status === 'EVALUATED').length,
    INCOMPLETE: data.items.filter((s) => s.status !== 'SUBMITTED' && s.status !== 'EVALUATED').length,
  };

  const download = async (submission) => {
    setDownloadError(null);
    setBusyId(submission.submissionId);
    try {
      const result = await apiFetch(
        `/submissions/${encodeURIComponent(submission.submissionId)}/download-url`,
        { method: 'POST', body: {} },
      );
      window.open(result.downloadUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setDownloadError(err);
    } finally {
      setBusyId(null);
    }
  };

  const tabs = [
    { key: 'ALL', label: 'All' },
    { key: 'PENDING', label: 'To evaluate' },
    { key: 'EVALUATED', label: 'Evaluated' },
    { key: 'INCOMPLETE', label: 'Incomplete uploads' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <Link to="/faculty" className="text-sm font-medium text-brand-600 hover:underline">
          ← Back to dashboard
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Submissions</h1>
            <p className="text-sm text-slate-500">
              {assignment.title} · deadline {formatDate(assignment.dueDate)} · {assignment.maxMarks}{' '}
              max marks
            </p>
          </div>
          <Link
            to={`/faculty/assignments/${assignment.assignmentId}/edit`}
            className="btn-secondary"
          >
            Edit assignment
          </Link>
        </div>
      </div>

      <ErrorBanner error={downloadError} />

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter submissions">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              tab === t.key
                ? 'bg-brand-600 text-white'
                : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-300 hover:bg-slate-50'
            }`}
            onClick={() => setTab(t.key)}
          >
            {t.label} ({counts[t.key]})
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="No submissions in this view"
          message={
            tab === 'ALL'
              ? 'Students have not uploaded anything for this assignment yet.'
              : 'Nothing matches this filter.'
          }
          action={
            <button type="button" className="btn-secondary" onClick={run}>
              Refresh
            </button>
          }
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th scope="col">Student</th>
                <th scope="col">File</th>
                <th scope="col">Submitted</th>
                <th scope="col">Status</th>
                <th scope="col">Marks</th>
                <th scope="col" className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((submission) => (
                <tr key={submission.submissionId}>
                  <td>
                    <p className="font-medium text-slate-900">
                      {submission.studentName || submission.studentEmail || 'Student'}
                    </p>
                    <p className="text-xs text-slate-400">{submission.studentEmail}</p>
                  </td>
                  <td className="max-w-[14rem] truncate">{submission.fileName || '—'}</td>
                  <td>{formatDate(submission.submittedAt)}</td>
                  <td><StatusBadge status={submission.status} /></td>
                  <td>
                    {submission.status === 'EVALUATED' ? (
                      <span className="font-semibold">{submission.marks} / {assignment.maxMarks}</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        className="font-medium text-brand-600 hover:underline disabled:opacity-50"
                        onClick={() => download(submission)}
                        disabled={
                          busyId === submission.submissionId ||
                          submission.status === 'PENDING_UPLOAD' ||
                          submission.status === 'EXPIRED'
                        }
                      >
                        {busyId === submission.submissionId ? 'Preparing…' : 'Download'}
                      </button>
                      <Link
                        to={`/faculty/submissions/${submission.submissionId}/evaluate`}
                        className="font-medium text-slate-700 hover:underline"
                      >
                        {submission.status === 'EVALUATED' ? 'Update' : 'Evaluate'}
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
