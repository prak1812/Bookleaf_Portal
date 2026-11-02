const TOKEN_KEY = 'bookleaf_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) =>
  token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY);

export async function api(path, { method = 'GET', body } = {}) {
  const token = getToken();
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) setToken(null); // login expired: force a fresh sign-in
    const err = new Error((data.error && data.error.message) || 'Something went wrong');
    err.code = data.error && data.error.code;
    err.details = data.error && data.error.details;
    err.status = res.status;
    throw err;
  }
  return data;
}