import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const studentLinks = [
  { to: '/student', label: 'Dashboard', icon: '📊', end: true },
  { to: '/assignments', label: 'Assignments', icon: '📚' },
  { to: '/submissions', label: 'My submissions', icon: '📤' },
];

const facultyLinks = [
  { to: '/faculty', label: 'Dashboard', icon: '📊', end: true },
  { to: '/assignments', label: 'Assignments', icon: '📚' },
  { to: '/faculty/assignments/new', label: 'Create assignment', icon: '➕' },
  { to: '/faculty/evaluations', label: 'Evaluations', icon: '✅' },
];

export default function Sidebar({ onNavigate }) {
  const { user, logout, isFaculty } = useAuth();
  const links = isFaculty ? facultyLinks : studentLinks;

  return (
    <div className="flex h-full flex-col bg-slate-900 text-slate-100">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 font-bold text-white">
          AP
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">Assignment Portal</p>
          <p className="text-xs text-slate-400">College submission & evaluation</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3" aria-label="Main navigation">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <span aria-hidden="true">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-800 px-4 py-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold uppercase">
            {(user?.email || '?').slice(0, 2)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-100">{user?.name || user?.email}</p>
            <p className="truncate text-xs text-slate-400">{user?.email}</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <span className="truncate text-xs capitalize text-slate-400">{user?.role}</span>
          <button
            type="button"
            className="rounded-md border border-slate-700 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
            onClick={logout}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
