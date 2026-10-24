import { useState } from 'react';
import { Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FormField from '../components/FormField';
import ErrorBanner from '../components/ErrorBanner';
import { validateLogin } from '../utils/validation';

export default function Login() {
  const { status, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (status === 'authenticated') {
    return <Navigate to={location.state?.from || '/'} replace />;
  }

  const onChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);
    const nextErrors = validateLogin(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setBusy(true);
    try {
      const user = await login(values.email.trim(), values.password);
      navigate(location.state?.from || (user.role === 'faculty' ? '/faculty' : '/student'), {
        replace: true,
      });
    } catch (error) {
      setFormError(error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">
            AP
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Assignment Portal</h1>
          <p className="mt-1 text-sm text-slate-500">
            Sign in with your college account to continue.
          </p>
        </div>

        <form className="card space-y-4 p-6" onSubmit={onSubmit} noValidate>
          <ErrorBanner error={formError} />

          <FormField label="Email address" required error={errors.email}>
            {({ id, describedBy }) => (
              <input
                id={id}
                name="email"
                type="email"
                autoComplete="username"
                className="input"
                placeholder="you@college.edu"
                value={values.email}
                onChange={onChange}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={describedBy}
              />
            )}
          </FormField>

          <FormField label="Password" required error={errors.password}>
            {({ id, describedBy }) => (
              <input
                id={id}
                name="password"
                type="password"
                autoComplete="current-password"
                className="input"
                value={values.password}
                onChange={onChange}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={describedBy}
              />
            )}
          </FormField>

          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="text-center text-xs text-slate-500">
            Students and faculty use the same sign-in page. Your role comes from your Cognito
            group membership.
          </p>
        </form>

        <p className="mt-4 text-center text-xs text-slate-400">
          Trouble signing in? Contact your administrator · <Link to="/unauthorized" className="underline">Access rules</Link>
        </p>
      </div>
    </div>
  );
}
