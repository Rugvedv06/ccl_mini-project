import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiFetch, uploadToPresignedUrl, ApiError } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import Spinner from '../components/Spinner';
import ErrorBanner from '../components/ErrorBanner';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';
import { validateUploadSelection } from '../utils/validation';
import { formatBytes, formatDate, isPast } from '../utils/format';

const STEP_LABELS = {
  idle: 'Select a file',
  requesting: 'Requesting secure upload…',
  uploading: 'Uploading to S3…',
  finalizing: 'Verifying upload…',
  done: 'Submitted',
};

export default function AssignmentUpload() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const { data, loading, error, run } = useAsync(
    () => apiFetch(`/assignments/${encodeURIComponent(assignmentId)}`),
    [assignmentId],
  );

  const [file, setFile] = useState(null);
  const [fieldError, setFieldError] = useState(null);
  const [step, setStep] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [actionError, setActionError] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (loading) return <Spinner label="Loading assignment…" />;
  if (error) return <ErrorBanner error={error} onRetry={run} />;

  const assignment = data?.assignment;
  if (!assignment) return <ErrorBanner error="Assignment not found." />;

  const deadlinePassed = isPast(assignment.dueDate);

  const onFileChange = (event) => {
    const selected = event.target.files?.[0] || null;
    setActionError(null);
    if (!selected) {
      setFile(null);
      setFieldError('Choose a file to upload.');
      return;
    }
    const errors = validateUploadSelection(selected, assignment.allowedFileTypes);
    setFile(selected);
    setFieldError(errors.file || null);
  };

  const startUpload = async () => {
    setConfirmOpen(false);
    setActionError(null);
    if (!file) return;

    const contentType = file.type || 'application/octet-stream';
    try {
      setStep('requesting');
      const reservation = await apiFetch('/submissions', {
        method: 'POST',
        body: {
          assignmentId: assignment.assignmentId,
          fileName: file.name,
          fileSize: file.size,
          contentType,
        },
      });

      setStep('uploading');
      setProgress(0);
      await uploadToPresignedUrl(reservation.uploadUrl, file, contentType, setProgress);

      setStep('finalizing');
      const final = await apiFetch(
        `/submissions/${encodeURIComponent(reservation.submissionId)}/finalize`,
        { method: 'POST', body: {} },
      );

      setStep('done');
      navigate(`/submissions/${final.submission.submissionId}`, {
        replace: true,
        state: { justSubmitted: true },
      });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Upload failed. Please try again.';
      setActionError(err instanceof ApiError ? err : new ApiError(message, { code: 'UPLOAD_FAILED' }));
      setStep('idle');
      setProgress(0);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          to={`/assignments/${assignment.assignmentId}`}
          className="text-sm font-medium text-brand-600 hover:underline"
        >
          ← Back to assignment
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Upload submission</h1>
        <p className="text-sm text-slate-500">{assignment.title}</p>
      </div>

      <div className="card space-y-5 p-6">
        <dl className="grid grid-cols-1 gap-3 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Deadline</dt>
            <dd className={`font-medium ${deadlinePassed ? 'text-rose-600' : 'text-slate-800'}`}>
              {formatDate(assignment.dueDate)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Max marks</dt>
            <dd className="font-medium text-slate-800">{assignment.maxMarks}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Allowed files</dt>
            <dd className="font-medium text-slate-800">
              {(assignment.allowedFileTypes || []).map((t) => `.${t}`).join(', ')}
            </dd>
          </div>
        </dl>

        {deadlinePassed ? (
          <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            The deadline has passed. The server will reject new submissions for this assignment.
          </p>
        ) : null}

        <ErrorBanner error={actionError} />

        <FormField
          label="Assignment file"
          required
          error={fieldError}
          hint="Your file is uploaded directly to a private S3 bucket with a short-lived presigned URL."
        >
          {({ id, describedBy }) => (
            <input
              id={id}
              ref={fileInputRef}
              type="file"
              className="input"
              accept={(assignment.allowedFileTypes || []).map((t) => `.${t}`).join(',')}
              onChange={onFileChange}
              disabled={deadlinePassed || step !== 'idle'}
              aria-describedby={describedBy}
            />
          )}
        </FormField>

        {file ? (
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-800">{file.name}</p>
              <p className="text-xs text-slate-500">
                {formatBytes(file.size)} · {file.type || 'unknown type'}
              </p>
            </div>
            <button
              type="button"
              className="ml-3 text-xs font-medium text-rose-600 hover:underline"
              onClick={() => {
                setFile(null);
                setFieldError(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              disabled={step !== 'idle'}
            >
              Remove
            </button>
          </div>
        ) : null}

        {step !== 'idle' ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>{STEP_LABELS[step]}</span>
              {step === 'uploading' ? <span>{Math.round(progress * 100)}%</span> : null}
            </div>
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-slate-200"
              role="progressbar"
              aria-valuenow={Math.round(progress * 100)}
              aria-valuemin="0"
              aria-valuemax="100"
              aria-label="Upload progress"
            >
              <div
                className="h-full rounded-full bg-brand-600 transition-all"
                style={{ width: `${Math.round((step === 'uploading' ? progress : step === 'finalizing' ? 0.95 : 0.4) * 100)}%` }}
              />
            </div>
          </div>
        ) : null}

        <div className="flex justify-end gap-3">
          <Link to={`/assignments/${assignment.assignmentId}`} className="btn-secondary">
            Cancel
          </Link>
          <button
            type="button"
            className="btn-primary"
            disabled={Boolean(deadlinePassed) || Boolean(fieldError) || !file || step !== 'idle'}
            onClick={() => setConfirmOpen(true)}
          >
            Upload submission
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm upload"
        message={`Upload "${file?.name}" (${file ? formatBytes(file.size) : ''}) for "${assignment.title}"? A submission record is created for you only.`}
        confirmLabel="Upload now"
        busy={step !== 'idle'}
        onConfirm={startUpload}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
