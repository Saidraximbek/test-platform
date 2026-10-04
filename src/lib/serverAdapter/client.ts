// Client HTTP requester with Auth header
const API_BASE = '/api';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('fargoniy_auth_token');
}

export function setAuthToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('fargoniy_auth_token', token);
  } else {
    localStorage.removeItem('fargoniy_auth_token');
  }
}

export async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errMessage = 'Serverda xatolik yuz berdi';
    try {
      const errData = await res.json();
      errMessage = errData.error || errData.message || errMessage;
    } catch {
      errMessage = await res.text();
    }
    throw new Error(errMessage || `Request failed with status ${res.status}`);
  }

  return res.json();
}
