import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import ErrorBanner from '../components/ErrorBanner';
import EmptyState from '../components/EmptyState';
import AssignmentCard from '../components/AssignmentCard';

export default function AssignmentList() {
  const { isFaculty } = useAuth();
  const { data, loading, error, run } = useAsync(() => apiFetch('/assignments'), []);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const items = data?.items || [];

  const filtered = useMemo(() => {
    return items.filter((assignment) => {
      const matchesQuery =
        !query.trim() ||
        assignment.title.toLowerCase().includes(query.trim().toLowerCase()) ||
        assignment.description?.toLowerCase().includes(query.trim().toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || assignment.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [items, query, statusFilter]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Assignments</h1>
          <p className="text-sm text-slate-500">
            {isFaculty
              ? 'Assignments you created. Publish to make them visible to students.'
              : 'All published assignments available to you.'}
          </p>
        </div>
        {isFaculty ? (
          <Link to="/faculty/assignments/new" className="btn-primary">
            Create assignment
          </Link>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="assignment-search" className="sr-only">
            Search assignments
          </label>
          <input
            id="assignment-search"
            type="search"
            className="input"
            placeholder="Search by title or description…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="sm:w-52">
          <label htmlFor="status-filter" className="sr-only">
            Filter by status
          </label>
          <select
            id="status-filter"
            className="input"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="ALL">All statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      <ErrorBanner error={error} onRetry={run} />
      {loading ? <Spinner label="Loading assignments…" /> : null}

      {!loading && !error ? (
        filtered.length === 0 ? (
          <EmptyState
            title={items.length === 0 ? 'No assignments yet' : 'No matching assignments'}
            message={
              items.length === 0
                ? isFaculty
                  ? 'Create your first assignment to get started.'
                  : 'Your lecturer has not published any assignments yet.'
                : 'Try clearing your search or status filter.'
            }
            action={
              isFaculty && items.length === 0 ? (
                <Link to="/faculty/assignments/new" className="btn-primary">
                  Create assignment
                </Link>
              ) : null
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((assignment) => (
              <AssignmentCard
                key={assignment.assignmentId}
                assignment={assignment}
                actionTo={
                  isFaculty
                    ? `/faculty/assignments/${assignment.assignmentId}/submissions`
                    : `/assignments/${assignment.assignmentId}`
                }
                actionLabel={isFaculty ? 'Manage submissions' : 'View details'}
              />
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}
