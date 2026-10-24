import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { formatDate, isPast } from '../utils/format';

export default function AssignmentCard({ assignment, actionTo, actionLabel }) {
  const overdue = isPast(assignment.dueDate) && assignment.status === 'PUBLISHED';
  return (
    <article className="card flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900">{assignment.title}</h3>
        <StatusBadge kind="assignment" status={assignment.status} />
      </div>
      <p className="line-clamp-3 text-sm text-slate-600">{assignment.description}</p>
      <dl className="grid grid-cols-2 gap-2 text-xs text-slate-500 sm:grid-cols-3">
        <div>
          <dt className="font-medium text-slate-400">Deadline</dt>
          <dd className={overdue ? 'font-medium text-rose-600' : 'text-slate-700'}>
            {formatDate(assignment.dueDate)}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-slate-400">Max marks</dt>
          <dd className="text-slate-700">{assignment.maxMarks}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-400">File types</dt>
          <dd className="text-slate-700">
            {(assignment.allowedFileTypes || []).map((t) => `.${t}`).join(', ') || '—'}
          </dd>
        </div>
      </dl>
      <div className="mt-auto flex justify-end pt-1">
        <Link to={actionTo} className="btn-primary">
          {actionLabel}
        </Link>
      </div>
    </article>
  );
}
