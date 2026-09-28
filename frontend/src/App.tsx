// ─────────────────────────────────────────────────────────────
// App.tsx — Root component with all features wired together
//
// FEATURES:
//   1. Offline Authentication & Master Password lock/unlock
//   2. Type filter sidebar (All / Code / Paper / Diagram / Note)
//   3. Full-text search bar (queries backend /api/documents/search)
//   4. Sort (Newest / Oldest / A→Z / Z→A) — client-side
//   5. Dashboard stats bar (counts per type)
//   6. Clickable cards → detail modal with copy + edit + delete
//   7. Edit documents — pre-fills AddDocumentModal
//   8. Tags — displayed on cards and in the detail view
//   9. Export — downloads visible documents as JSON
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './Sidebar';
import DocumentCard from './DocumentCard';
import AddDocumentModal from './AddDocumentModal';
import DocumentDetailModal from './DocumentDetailModal';
import AuthModal, { type AuthMode } from './AuthModal';
import {
  fetchDocuments, searchDocuments, fetchStats,
  createDocument, updateDocument, deleteDocument,
  getAuthStatus, getAuthToken, clearAuthToken,
} from './api';
import type { Doc, DocumentMeta, SortOrder } from './types';
import './index.css';

// ── Sort helper ───────────────────────────────────────────────
function sortDocs(docs: Doc[], order: SortOrder): Doc[] {
  return [...docs].sort((a, b) => {
    if (order === 'newest') return b.id - a.id;
    if (order === 'oldest') return a.id - b.id;
    if (order === 'az') return a.data.title.localeCompare(b.data.title);
    if (order === 'za') return b.data.title.localeCompare(a.data.title);
    return 0;
  });
}

const TYPE_COLOURS: Record<string, string> = {
  code: '#60a5fa', paper: '#34d399', diagram: '#c084fc', note: '#fbbf24',
};

export default function App() {
  const [docs,          setDocs]          = useState<Doc[]>([]);
  const [filter,        setFilter]        = useState('');
  const [searchQ,       setSearchQ]       = useState('');
  const [sortOrder,     setSortOrder]     = useState<SortOrder>('newest');
  const [stats,         setStats]         = useState<Record<string, number>>({});
  const [showModal,     setShowModal]     = useState(false);
  const [editDoc,       setEditDoc]       = useState<Doc | null>(null);   // doc being edited
  const [selectedDoc,   setSelectedDoc]   = useState<Doc | null>(null);  // doc being viewed
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');

  // ── Auth states ─────────────────────────────────────────────
  const [authModal,     setAuthModal]     = useState<AuthMode | null>(null);
  const [setupRequired, setSetupRequired] = useState(false);
  const [isLocked,      setIsLocked]      = useState(false);

  // Debounce ref for search
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Check Auth Status ────────────────────────────────────────
  const checkAuth = useCallback(async () => {
    try {
      const status = await getAuthStatus();
      if (status.setup_required) {
        setSetupRequired(true);
        setIsLocked(true);
        setAuthModal('setup');
      } else {
        setSetupRequired(false);
        const token = getAuthToken();
        if (!token) {
          setIsLocked(true);
          setAuthModal('login');
        } else {
          setIsLocked(false);
        }
      }
    } catch {
      // Backend not running or offline
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // ── Load documents ───────────────────────────────────────────
  const loadDocs = useCallback(async (type: string, q: string) => {
    setLoading(true); setError('');
    try {
      const data = q.trim().length >= 2
        ? await searchDocuments(q.trim())
        : await fetchDocuments(type || undefined);
      setDocs(data);
    } catch {
      setError('Cannot reach the backend. Make sure the Python server is running on port 8000.');
    } finally { setLoading(false); }
  }, []);

  const loadStats = useCallback(async () => {
    try { setStats(await fetchStats()); } catch { /* stats are non-critical */ }
  }, []);

  useEffect(() => {
    if (!isLocked) {
      loadDocs(filter, searchQ);
    }
  }, [filter, loadDocs, isLocked]);

  useEffect(() => {
    if (!isLocked) {
      loadStats();
    }
  }, [loadStats, isLocked]);

  // ── Auth Handlers ────────────────────────────────────────────
  function handleAuthSuccess() {
    setAuthModal(null);
    setIsLocked(false);
    setSetupRequired(false);
    loadDocs(filter, searchQ);
    loadStats();
  }

  function handleLockApp() {
    if (setupRequired) {
      setAuthModal('setup');
      return;
    }
    clearAuthToken();
    setIsLocked(true);
    setAuthModal('login');
  }

  function handleChangePassword() {
    setAuthModal('change_password');
  }

  // ── Search with debounce ─────────────────────────────────────
  function handleSearch(q: string) {
    setSearchQ(q);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => loadDocs(filter, q), 350);
  }

  // ── Save (create or edit) ────────────────────────────────────
  async function handleSave(meta: DocumentMeta) {
    if (editDoc) {
      await updateDocument(editDoc.id, meta);
    } else {
      await createDocument(meta);
    }
    setShowModal(false); setEditDoc(null);
    await loadDocs(filter, searchQ);
    await loadStats();
  }

  // ── Delete ───────────────────────────────────────────────────
  async function handleDelete(id: number) {
    setDocs(prev => prev.filter(d => d.id !== id)); // optimistic
    try {
      await deleteDocument(id);
      await loadStats();
    } catch { loadDocs(filter, searchQ); }
  }

  // ── Export ───────────────────────────────────────────────────
  function handleExport() {
    const visible = sortDocs(docs, sortOrder);
    const blob = new Blob([JSON.stringify(visible, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `lit-organizer-export-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const visibleDocs = sortDocs(docs, sortOrder);
  const totalDocs   = Object.values(stats).reduce((s, c) => s + c, 0);

  return (
    <div className="flex min-h-screen">
      {/* ── Sidebar ──────────────────────────────────────────── */}
      <Sidebar
        active={filter}
        onSelect={(v) => { setFilter(v); setSearchQ(''); }}
        onLockApp={handleLockApp}
        onChangePassword={handleChangePassword}
        isLocked={isLocked}
        setupRequired={setupRequired}
      />

      {/* ── Main ─────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden relative">

        {/* ── Dashboard stats bar ──────────────────────────── */}
        {totalDocs > 0 && (
          <div className="flex gap-4 px-8 pt-6 pb-0 flex-wrap">
            {Object.entries(stats).map(([type, count]) => (
              <div key={type} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
                style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)' }}>
                <span className="w-2 h-2 rounded-full" style={{ background: TYPE_COLOURS[type] ?? '#94a3b8' }} />
                <span style={{ color: 'var(--text-muted)' }} className="capitalize">{type}s</span>
                <span className="font-bold" style={{ color: 'var(--text-main)' }}>{count}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm ml-auto"
              style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total</span>
              <span className="font-bold" style={{ color: 'var(--accent-2)' }}>{totalDocs}</span>
            </div>
          </div>
        )}

        {/* ── Top bar: search + sort + actions ─────────────── */}
        <div className="flex items-center gap-3 px-8 pt-6 pb-4 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-muted)' }}>🔍</span>
            <input
              id="search-input"
              className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none"
              style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
              placeholder="Search title, content, tags, author…"
              value={searchQ}
              onChange={e => handleSearch(e.target.value)}
            />
          </div>

          {/* Sort */}
          <select
            id="sort-select"
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value as SortOrder)}
            className="rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text-main)' }}
          >
            <option value="newest">↓ Newest first</option>
            <option value="oldest">↑ Oldest first</option>
            <option value="az">A → Z</option>
            <option value="za">Z → A</option>
          </select>

          {/* Export */}
          {docs.length > 0 && (
            <button onClick={handleExport}
              id="export-btn"
              className="px-4 py-2.5 rounded-xl text-sm font-medium transition hover:opacity-80"
              style={{ background: 'var(--bg-panel)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              📤 Export
            </button>
          )}

          {/* Add */}
          <button
            id="add-document-btn"
            onClick={() => { setEditDoc(null); setShowModal(true); }}
            className="px-5 py-2.5 rounded-xl font-semibold text-sm transition hover:opacity-90 active:scale-95 shadow-md"
            style={{ background: 'var(--accent)', color: '#fff' }}>
            + Add Document
          </button>
        </div>

        {/* ── Page title ────────────────────────────────────── */}
        <div className="px-8 pb-2">
          <h2 className="text-xl font-bold">
            {searchQ ? `Search: "${searchQ}"` : filter ? `${filter.charAt(0).toUpperCase() + filter.slice(1)}s` : 'All Documents'}
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {visibleDocs.length} result{visibleDocs.length !== 1 ? 's' : ''}
            {searchQ ? ' found' : ' stored locally'}
          </p>
        </div>

        {/* ── Scrollable content ─────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-8 pb-8 pt-2">
          {/* Error */}
          {error && (
            <div className="rounded-xl px-5 py-4 text-sm mb-6"
              style={{ background: '#3d1e1e', color: '#f87171', border: '1px solid #7f1d1d' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Spinner */}
          {loading && (
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: 'var(--accent)' }} />
            </div>
          )}

          {/* Empty */}
          {!loading && !error && visibleDocs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 gap-4 opacity-50">
              <p className="text-5xl">{searchQ ? '🔎' : '📭'}</p>
              <p className="text-lg font-medium">{searchQ ? 'No results found' : 'No documents yet'}</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {searchQ ? 'Try a different search term' : 'Click + Add Document to get started'}
              </p>
            </div>
          )}

          {/* Grid */}
          {!loading && visibleDocs.length > 0 && (
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {visibleDocs.map(doc => (
                <DocumentCard
                  key={doc.id} doc={doc}
                  onClick={(d) => setSelectedDoc(d)}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Footer credit ─────────────────────────────────────── */}
        <footer
          className="shrink-0 flex items-center justify-between px-8 py-3 text-xs"
          style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}
        >
          <span>
            Developed with{' '}
            <span
              className="animate-pulse"
              style={{ color: '#f87171', fontSize: '13px' }}
            >
              ❤️
            </span>
            {' '}by{' '}
            <span className="font-semibold" style={{ color: 'var(--accent-2)' }}>
              Saroj
            </span>
          </span>

          <span style={{ color: 'var(--border)' }}>·</span>

          <span>
            © {new Date().getFullYear()}{' '}
            <span className="font-medium" style={{ color: 'var(--text-muted)' }}>
              Literature Organizer
            </span>
            {' '}· All rights reserved
          </span>
        </footer>

      </main>

      {/* ── Add / Edit modal ─────────────────────────────────── */}
      {showModal && (
        <AddDocumentModal
          initialDoc={editDoc ?? undefined}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditDoc(null); }}
        />
      )}

      {/* ── Detail view modal ────────────────────────────────── */}
      {selectedDoc && (
        <DocumentDetailModal
          doc={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onDelete={(id) => { handleDelete(id); setSelectedDoc(null); }}
          onEdit={(doc) => { setSelectedDoc(null); setEditDoc(doc); setShowModal(true); }}
        />
      )}

      {/* ── Auth Modal (Setup / Login / Change Password) ─────── */}
      {authModal && (
        <AuthModal
          mode={authModal}
          canClose={authModal === 'change_password' || (!isLocked && !setupRequired)}
          onSuccess={handleAuthSuccess}
          onClose={() => setAuthModal(null)}
        />
      )}
    </div>
  );
}
