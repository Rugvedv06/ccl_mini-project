export default function EmptyState({ title = 'Nothing here yet', message, action }) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl" aria-hidden="true">
        📭
      </div>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {message ? <p className="mt-1 max-w-md text-sm text-slate-500">{message}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
