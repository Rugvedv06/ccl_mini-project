export default function StatCard({ label, value, hint, accent = 'brand' }) {
  const accents = {
    brand: 'bg-brand-50 text-brand-700',
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    slate: 'bg-slate-100 text-slate-700',
  };
  return (
    <div className="card flex flex-col gap-1 p-5">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-lg ${accents[accent] || accents.brand}`} aria-hidden="true">
        {label?.slice(0, 1)}
      </div>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
      {hint ? <p className="text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}
