import { getCurrentSession, refreshCurrentSession } from './auth';

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'UNKNOWN', details = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

let sessionProvider = () => getCurrentSession();
let onUnauthorized = null;

export function setSessionProvider(fn) {
  sessionProvider = fn;
}

/** Registered by AuthContext: called when the API rejects our token twice. */
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

function baseUrl() {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (!url) {
    throw new ApiError(
      'VITE_API_BASE_URL is not configured. Copy frontend/.env.example to frontend/.env and set it to the API Gateway stage URL from the SAM deployment output.',
      { code: 'CONFIG_MISSING' },
    );
  }
  return url.replace(/\/$/, '');
}

async function parseJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

async function attempt(method, path, body, token, extra) {
  const headers = { Accept: 'application/json', ...(extra?.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (body instanceof FormData || body instanceof Blob || typeof body === 'string') {
    payload = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const response = await fetch(`${baseUrl()}${path}`, {
    method,
    headers,
    body: payload,
    signal: extra?.signal,
  });
  return { response, data: await parseJson(response) };
}

export async function apiFetch(path, { method = 'GET', body, signal, headers, auth = true } = {}) {
  let token = null;
  if (auth) {
    const session = await sessionProvider();
    if (!session?.idToken) {
      const err = new ApiError('Your session has expired. Please sign in again.', {
        status: 401,
        code: 'UNAUTHENTICATED',
      });
      if (onUnauthorized) onUnauthorized();
      throw err;
    }
    token = session.idToken;
  }

  let result;
  try {
    result = await attempt(method, path, body, token, { signal, headers });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError('Could not reach the API. Check your connection and API configuration.', {
      code: 'NETWORK_ERROR',
    });
  }

  if (result.response.status === 401 && auth) {
    try {
      const refreshed = await refreshCurrentSession();
      if (refreshed?.idToken) {
        result = await attempt(method, path, body, refreshed.idToken, { signal, headers });
      }
    } catch {
      /* fall through to the 401 handling below */
    }
  }

  if (!result.response.ok) {
    if (result.response.status === 401 && onUnauthorized) onUnauthorized();
    const message =
      result.data?.message ||
      result.data?.error ||
      `Request failed with status ${result.response.status}.`;
    const error = new ApiError(message, {
      status: result.response.status,
      code: result.data?.code || 'REQUEST_FAILED',
      details: result.data?.errors || null,
    });
    throw error;
  }

  return result.data;
}

/** Uploads the file directly to the private S3 bucket using a short-lived presigned URL. */
export async function uploadToPresignedUrl(uploadUrl, file, contentType, onProgress) {
  if (typeof XMLHttpRequest === 'undefined') {
    // Non-browser fallback (tests) - plain fetch.
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: file,
    });
    if (!res.ok) throw new ApiError('S3 upload failed.', { status: res.status, code: 'S3_UPLOAD' });
    return;
  }
  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) onProgress(event.loaded / event.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else
        reject(
          new ApiError(`S3 rejected the upload (HTTP ${xhr.status}).`, {
            status: xhr.status,
            code: 'S3_UPLOAD',
          }),
        );
    };
    xhr.onerror = () =>
      reject(new ApiError('Network error while uploading to S3.', { code: 'NETWORK_ERROR' }));
    xhr.send(file);
  });
}
