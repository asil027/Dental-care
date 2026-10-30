const API_BASE = '/api';

export function getAdminToken() {
  return localStorage.getItem('dc_admin_token');
}

export function setAdminToken(token) {
  if (token) {
    localStorage.setItem('dc_admin_token', token);
  } else {
    localStorage.removeItem('dc_admin_token');
  }
}

export async function apiRequest(endpoint, options = {}) {
  const token = getAdminToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  // If body is FormData, don't set Content-Type header so browser sets multipart boundary
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}

