import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import Spinner from '../components/Spinner';
import ErrorBanner from '../components/ErrorBanner';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';
import { validateAssignmentForm } from '../utils/validation';
import { ASSIGNMENT_STATUS, FILE_TYPE_OPTIONS } from '../utils/constants';

function toDatetimeLocal(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

const EMPTY = {
  title: '',
  description: '',
  dueDate: '',
  maxMarks: 100,
  allowedFileTypes: ['pdf'],
  status: ASSIGNMENT_STATUS.DRAFT,
};

export default function AssignmentForm() {
  const { assignmentId } = useParams();
  const isEdit = Boolean(assignmentId);
  const navigate = useNavigate();

  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loaded, setLoaded] = useState(!isEdit);

  const { data, loading, error, run } = useAsync(
    () => (isEdit ? apiFetch(`/assignments/${encodeURIComponent(assignmentId)}`) : Promise.resolve(null)),
    [assignmentId],
    { immediate: isEdit },
  );

  useEffect(() => {
    if (!data?.assignment || loaded) return;
    const a = data.assignment;
    setValues({
      title: a.title || '',
      description: a.description || '',
      dueDate: toDatetimeLocal(a.dueDate),
      maxMarks: a.maxMarks ?? 100,
      allowedFileTypes: a.allowedFileTypes || [],
      status: a.status || ASSIGNMENT_STATUS.DRAFT,
    });
    setLoaded(true);
  }, [data, loaded]);

  const setField = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const toggleFileType = (ext) => {
    setValues((prev) => {
      const has = prev.allowedFileTypes.includes(ext);
      const next = has
        ? prev.allowedFileTypes.filter((t) => t !== ext)
        : [...prev.allowedFileTypes, ext];
      return { ...prev, allowedFileTypes: next };
    });
    setErrors((prev) => ({ ...prev, allowedFileTypes: undefined }));
  };

  const submit = async () => {
    setBusy(true);
    setFormError(null);
    try {
      const payload = {
        title: values.title.trim(),
        description: values.description.trim(),
        dueDate: new Date(values.dueDate).toISOString(),
        maxMarks: Number(values.maxMarks),
        allowedFileTypes: values.allowedFileTypes,
        status: values.status,
      };
      if (isEdit) {
        await apiFetch(`/assignments/${encodeURIComponent(assignmentId)}`, {
          method: 'PUT',
          body: payload,
        });
      } else {
        await apiFetch('/assignments', { method: 'POST', body: payload });
      }
      navigate('/faculty', { replace: true });
    } catch (err) {
      setFormError(err);
      setConfirmOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (event) => {
    event.preventDefault();
    setFormError(null);
    const nextErrors = validateAssignmentForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (values.status === ASSIGNMENT_STATUS.PUBLISHED) setConfirmOpen(true);
    else submit();
  };

  if (isEdit && loading) return <Spinner label="Loading assignment…" />;
  if (isEdit && error) return <ErrorBanner error={error} onRetry={run} />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link to="/faculty" className="text-sm font-medium text-brand-600 hover:underline">
          ← Back to dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
          {isEdit ? 'Edit assignment' : 'Create assignment'}
        </h1>
        <p className="text-sm text-slate-500">
          Drafts are only visible to you. Publishing makes the assignment visible to every student.
        </p>
      </div>

      <form className="card space-y-5 p-6" onSubmit={onSubmit} noValidate>
        <ErrorBanner error={formError} />

        <FormField label="Title" required error={errors.title}>
          {({ id, describedBy }) => (
            <input
              id={id}
              className="input"
              value={values.title}
              onChange={(e) => setField('title', e.target.value)}
              maxLength={120}
              placeholder="e.g. Lab 3 — REST API design"
              aria-invalid={Boolean(errors.title)}
              aria-describedby={describedBy}
            />
          )}
        </FormField>

        <FormField label="Description" required error={errors.description} hint="What must students submit? Include marking criteria.">
          {({ id, describedBy }) => (
            <textarea
              id={id}
              className="input min-h-[140px]"
              value={values.description}
              onChange={(e) => setField('description', e.target.value)}
              rows={6}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={describedBy}
            />
          )}
        </FormField>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField label="Deadline" required error={errors.dueDate}>
            {({ id, describedBy }) => (
              <input
                id={id}
                type="datetime-local"
                className="input"
                value={values.dueDate}
                onChange={(e) => setField('dueDate', e.target.value)}
                aria-invalid={Boolean(errors.dueDate)}
                aria-describedby={describedBy}
              />
            )}
          </FormField>

          <FormField label="Maximum marks" required error={errors.maxMarks}>
            {({ id, describedBy }) => (
              <input
                id={id}
                type="number"
                min="1"
                max="1000"
                step="1"
                className="input"
                value={values.maxMarks}
                onChange={(e) => setField('maxMarks', e.target.value)}
                aria-invalid={Boolean(errors.maxMarks)}
                aria-describedby={describedBy}
              />
            )}
          </FormField>
        </div>

        <FormField label="Accepted file types" required error={errors.allowedFileTypes}>
          {({ id, describedBy }) => (
            <div
              id={id}
              className="grid grid-cols-2 gap-2 sm:grid-cols-4"
              role="group"
              aria-describedby={describedBy}
            >
              {FILE_TYPE_OPTIONS.map((option) => {
                const checked = values.allowedFileTypes.includes(option.ext);
                return (
                  <label
                    key={option.ext}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                      checked
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      checked={checked}
                      onChange={() => toggleFileType(option.ext)}
                    />
                    <span>.{option.ext}</span>
                  </label>
                );
              })}
            </div>
          )}
        </FormField>

        <FormField label="Visibility" required error={errors.status} hint="Students only see published assignments.">
          {({ id }) => (
            <select
              id={id}
              className="input"
              value={values.status}
              onChange={(e) => setField('status', e.target.value)}
            >
              <option value={ASSIGNMENT_STATUS.DRAFT}>Draft — visible only to me</option>
              <option value={ASSIGNMENT_STATUS.PUBLISHED}>Published — visible to students</option>
              {isEdit ? (
                <option value={ASSIGNMENT_STATUS.CLOSED}>Closed — no longer accepting work</option>
              ) : null}
            </select>
          )}
        </FormField>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
          <Link to="/faculty" className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Create assignment'}
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        title="Publish assignment?"
        message={`"${values.title}" will become visible to all students immediately. They will be able to upload files until the deadline.`}
        confirmLabel="Publish"
        busy={busy}
        onConfirm={submit}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
