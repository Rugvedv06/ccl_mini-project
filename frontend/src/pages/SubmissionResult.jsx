import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import ErrorBanner from '../components/ErrorBanner';
import StatusBadge from '../components/StatusBadge';
import { formatBytes, formatDate } from '../utils/format';
import { SUBMISSION_STATUS } from '../utils/constants';

function Timeline({ status }) {
  const steps = [
    { key: SUBMISSION_STATUS.PENDING_UPLOAD, label: 'Upload requested' },
    { key: SUBMISSION_STATUS.SUBMITTED, label: 'File submitted' },
    { key: SUBMISSION_STATUS.EVALUATED, label: 'Evaluated' },
  ];
  const order = steps.findIndex((s) => s.key === status);
  const effectiveOrder = status === SUBMISSION_STATUS.EXPIRED ? 0 : order;
  return (
    <ol className="space-y-3">
      {steps.map((step, index) => {
        const done = index <= effectiveOrder;
        return (
          <li key={step.key} className="flex items-center gap-3">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                done ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}
              aria-hidden="true"
            >
              {index + 1}
            </span>
            <span className={`text-sm ${done ? 'font-medium text-slate-800' : 'text-slate-400'}`}>
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function SubmissionResult() {
  const { submissionId } = useParams();
  const location = useLocation();
  const { isFaculty } = useAuth();
  const [downloadError, setDownloadError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const { data, loading, error, run } = useAsync(
    () => apiFetch(`/submissions/${encodeURIComponent(submissionId)}/status`),
    [submissionId],
  );

  if (loading) return <Spinner label="Loading submission status…" />;
  if (error) return <ErrorBanner error={error} onRetry={run} />;

  const submission = data?.submission;
  if (!submission) return <ErrorBanner error="Submission not found." />;

  const download = async () => {
    setDownloadError(null);
    setDownloading(true);
    try {
      const result = await apiFetch(
        `/submissions/${encodeURIComponent(submissionId)}/download-url`,
        { method: 'POST', body: {} },
      );
      window.open(result.downloadUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setDownloadError(err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            to={isFaculty ? '/faculty' : '/submissions'}
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            ← Back
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Submission status</h1>
          <p className="text-sm text-slate-500">
            {submission.assignment?.title || submission.assignmentId}
          </p>
        </div>
        <StatusBadge status={submission.status} />
      </div>

      {location.state?.justSubmitted ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Your file was uploaded and verified successfully.
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="card p-6 lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Details</h2>
          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-slate-400">File name</dt>
              <dd className="mt-0.5 text-sm font-medium text-slate-800">{submission.fileName || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-400">File size</dt>
              <dd className="mt-0.5 text-sm font-medium text-slate-800">
                {formatBytes(submission.fileSize)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-400">Submitted at</dt>
              <dd className="mt-0.5 text-sm font-medium text-slate-800">
                {formatDate(submission.submittedAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-400">Last updated</dt>
              <dd className="mt-0.5 text-sm font-medium text-slate-800">
                {formatDate(submission.updatedAt)}
              </dd>
            </div>
          </dl>

          <div className="mt-5">
            <ErrorBanner error={downloadError} />
            <button
              type="button"
              className="btn-secondary"
              onClick={download}
              disabled={downloading || submission.status === SUBMISSION_STATUS.PENDING_UPLOAD}
            >
              {downloading ? 'Preparing secure link…' : 'Download my file'}
            </button>
            <p className="mt-2 text-xs text-slate-500">
              A short-lived signed URL is generated only after the server authorises you.
            </p>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Progress</h2>
          <div className="mt-4">
            <Timeline status={submission.status} />
          </div>
        </section>
      </div>

      <section className="card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Result</h2>
        {submission.status === SUBMISSION_STATUS.EVALUATED ? (
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-3xl font-semibold text-slate-900">
                  {submission.marks}
                  <span className="text-lg font-medium text-slate-400">
                    {' / '}
                    {submission.assignment?.maxMarks ?? '—'}
                  </span>
                </p>
                <p className="text-xs text-slate-500">Marks</p>
              </div>
              <div className="text-sm text-slate-600">
                <p>
                  Evaluated on{' '}
                  <span className="font-medium text-slate-800">
                    {formatDate(submission.evaluatedAt)}
                  </span>
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">Feedback</p>
              <p className="mt-1 whitespace-pre-line rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
                {submission.feedback}
              </p>
            </div>
          </div>
        ) : submission.status === SUBMISSION_STATUS.SUBMITTED ? (
          <p className="mt-3 text-sm text-slate-600">
            Your work has been received and is waiting for evaluation. You will see marks and
            feedback here once your lecturer evaluates it.
          </p>
        ) : (
          <p className="mt-3 text-sm text-slate-600">
            No result yet. Complete the upload first.
          </p>
        )}
      </section>
    </div>
  );
}
