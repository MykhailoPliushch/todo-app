export const API = (path, opts) =>
  fetch(`http://localhost:3000${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  }).then(async (r) => {
    if (!r.ok) {
      const text = await r.text();
      throw new Error(`Request Error ${r.status}: ${text}`);
    }
    return r.json();
  });
