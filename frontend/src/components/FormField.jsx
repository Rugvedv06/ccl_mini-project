let idCounter = 0;

export default function FormField({ label, error, hint, required, htmlFor, children, className = '' }) {
  const generated = `field-${(idCounter += 1)}`;
  const id = htmlFor || generated;
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={className}>
      <label htmlFor={id}>
        {label}
        {required ? <span className="ml-0.5 text-rose-600" aria-hidden="true">*</span> : null}
      </label>
      <div className="mt-1">{typeof children === 'function' ? children({ id, describedBy }) : children}</div>
      {hint && !error ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs font-medium text-rose-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
