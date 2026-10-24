import { ASSIGNMENT_STATUS, SUBMISSION_STATUS } from '../utils/constants';

const SUBMISSION_CLASSES = {
  PENDING_UPLOAD: 'bg-amber-50 text-amber-700 ring-amber-200',
  SUBMITTED: 'bg-blue-50 text-blue-700 ring-blue-200',
  EVALUATED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  EXPIRED: 'bg-slate-100 text-slate-600 ring-slate-200',
};

const ASSIGNMENT_CLASSES = {
  DRAFT: 'bg-slate-100 text-slate-600 ring-slate-200',
  PUBLISHED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  CLOSED: 'bg-rose-50 text-rose-700 ring-rose-200',
};

const SUBMISSION_LABELS = {
  PENDING_UPLOAD: 'Awaiting upload',
  SUBMITTED: 'Submitted',
  EVALUATED: 'Evaluated',
  EXPIRED: 'Upload expired',
};

export default function StatusBadge({ kind = 'submission', status }) {
  const isAssignment = kind === 'assignment';
  const classes = isAssignment
    ? ASSIGNMENT_CLASSES[status] || 'bg-slate-100 text-slate-600 ring-slate-200'
    : SUBMISSION_CLASSES[status] || 'bg-slate-100 text-slate-600 ring-slate-200';
  const label = isAssignment
    ? (ASSIGNMENT_STATUS[status] && status) || status
    : SUBMISSION_LABELS[status] || status;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${classes}`}
    >
      {label}
    </span>
  );
}
