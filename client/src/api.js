const BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';

export async function uploadFiles(formData) {
    const res = await fetch(`${BASE}/files/upload`, { method: 'POST', body: formData });
    return res.json();
}

export async function listFiles() {
    const res = await fetch(`${BASE}/files`);
    return res.json();
}

export async function getFile(id) {
    const res = await fetch(`${BASE}/files/${id}`);
    return res.json();
}

export async function startConversion(id) {
    const res = await fetch(`${BASE}/files/${id}/start`, { method: 'POST' });
    return res.json();
}

export function downloadUrl(id) {
    return `${BASE}/files/${id}/download`;
}
