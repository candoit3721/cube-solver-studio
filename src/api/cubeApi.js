const BASE = '/api';

export async function solveCube(cube, { format, method } = {}) {
  const body = { cube };
  if (format) body.format = format;
  if (method) body.method = method;
  const res = await fetch(`${BASE}/solve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Solve failed');
  return data;
}

export async function validateCube(cube, { format } = {}) {
  const body = { cube };
  if (format) body.format = format;
  const res = await fetch(`${BASE}/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Validation failed');
  return data;
}
