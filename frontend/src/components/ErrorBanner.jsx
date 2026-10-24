export default function ErrorBanner({ error, onRetry }) {
  if (!error) return null;
  const message =
    typeof error === 'string'
      ? error
      : error.message || 'Something went wrong.';
  const status = error.status;
  return (
    <div
      role="alert"
      className="flex flex-col gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        {status ? <span className="mr-2 font-semibold">Error {status}</span> : null}
        <span>{message}</span>
        {error.code && error.code !== 'UNKNOWN' ? (
          <span className="ml-2 rounded bg-rose-100 px-1.5 py-0.5 font-mono text-xs">{error.code}</span>
        ) : null}
      </div>
      {onRetry ? (
        <button type="button" className="btn-secondary shrink-0 !py-1 text-rose-700" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}
