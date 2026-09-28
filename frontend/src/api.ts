// api.ts — All fetch() calls in one place

import type { Doc, DocumentMeta } from './types';

const BASE = 'http://127.0.0.1:8000';

export function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

export function clearAuthToken(): void {
  localStorage.removeItem('auth_token');
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// ── Auth Endpoints ───────────────────────────────────────────
export async function getAuthStatus(): Promise<{ setup_required: boolean }> {
  const res = await fetch(`${BASE}/auth/status`);
  if (!res.ok) throw new Error('Failed to fetch auth status');
  return res.json();
}

export async function setupAuth(username: string, password: string): Promise<{ message: string }> {
  const res = await fetch(`${BASE}/auth/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Setup failed');
  }
  return res.json();
}

export async function loginAuth(username: string, password: string): Promise<{ access_token: string }> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Login failed');
  }
  const data = await res.json();
  if (data.access_token) {
    setAuthToken(data.access_token);
  }
  return data;
}

export async function changePassword(username: string, password: string): Promise<{ message: string }> {
  const res = await fetch(`${BASE}/auth/change-password`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to change password');
  }
  return res.json();
}

// ── Document Endpoints ───────────────────────────────────────
export async function fetchDocuments(type?: string): Promise<Doc[]> {
  const url = type ? `${BASE}/api/documents?doc_type=${type}` : `${BASE}/api/documents`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch documents');
  return res.json();
}

export async function searchDocuments(q: string): Promise<Doc[]> {
  const res = await fetch(`${BASE}/api/documents/search?q=${encodeURIComponent(q)}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}

export async function fetchStats(): Promise<Record<string, number>> {
  const res = await fetch(`${BASE}/api/documents/stats`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function createDocument(meta: DocumentMeta): Promise<{ id: number }> {
  const res = await fetch(`${BASE}/api/documents`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ metadata: meta }),
  });
  if (!res.ok) throw new Error('Failed to save document');
  return res.json();
}

export async function updateDocument(id: number, meta: DocumentMeta): Promise<void> {
  const res = await fetch(`${BASE}/api/documents/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ metadata: meta }),
  });
  if (!res.ok) throw new Error('Failed to update document');
}

export async function deleteDocument(id: number): Promise<void> {
  const res = await fetch(`${BASE}/api/documents/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete document');
}
