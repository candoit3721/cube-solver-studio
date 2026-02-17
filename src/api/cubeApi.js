const BASE = '/api';
const UNAVAILABLE = 'Server unavailable — make sure the backend is running on port 3001.';

export async function checkHealth() {
  try {
    const res = await fetch(`${BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

async function request(url, body) {
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(UNAVAILABLE);
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(UNAVAILABLE);
  }

  if (!res.ok) throw new Error(data.error?.message || `Request failed (${res.status})`);
  return data;
}

export async function solveCube(cube, { format, method } = {}) {
  const body = { cube };
  if (format) body.format = format;
  if (method) body.method = method;
  return request(`${BASE}/solve`, body);
}

export async function validateCube(cube, { format } = {}) {
  const body = { cube };
  if (format) body.format = format;
  return request(`${BASE}/validate`, body);
}
