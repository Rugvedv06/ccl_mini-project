export function formatDate(value, { withTime = true } = {}) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date);
}

export function formatBytes(bytes) {
  if (bytes === null || bytes === undefined) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[i]}`;
}

export function isPast(dateValue) {
  const date = new Date(dateValue);
  return !Number.isNaN(date.getTime()) && date.getTime() < Date.now();
}

export function initials(emailOrName = '') {
  const base = (emailOrName.split('@')[0] || '').replace(/[._-]+/g, ' ').trim();
  if (!base) return '?';
  return base
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export function extensionOf(fileName = '') {
  const idx = fileName.lastIndexOf('.');
  return idx === -1 ? '' : fileName.slice(idx + 1).toLowerCase();
}
