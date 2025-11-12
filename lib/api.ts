export async function getJSON<T = any>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, { ...init, headers: { ...(init?.headers || {}) } });
  if (!r.ok) throw new Error(`GET ${url} → ${r.status}`);
  return r.json();
}

export async function postJSON<T = any>(url: string, body?: any, init?: RequestInit): Promise<T> {
  const r = await fetch(url, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!r.ok) throw new Error(`POST ${url} → ${r.status}`);
  return r.json();
}
