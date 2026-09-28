// ─────────────────────────────────────────────────────────────
// DocumentDetailModal.tsx — Full document viewer
//
// WHAT IT SHOWS:
//   - Type badge + document title as header
//   - Full content in a scrollable pane
//   - For code: monospace pre block with language label + copy btn
//   - For papers: readable prose with author/date metadata
//   - For diagrams/notes: whitespace-preserved text
//
// INTERACTION:
//   - Click backdrop or ✕ to close
//   - Copy button copies the full content to clipboard
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import type { Doc } from './types';

function tagClass(type: string): string {
  const map: Record<string, string> = {
    code: 'tag-code', paper: 'tag-paper',
    diagram: 'tag-diagram', note: 'tag-note',
  };
  return map[type] ?? 'tag-default';
}

interface Props {
  doc: Doc;
  onClose: () => void;
  onDelete: (id: number) => void;
  onEdit: (doc: Doc) => void;
}

export default function DocumentDetailModal({ doc, onClose, onDelete, onEdit }: Props) {
  const { title, type, content, language, author } = doc.data;
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDelete() {
    onDelete(doc.id);
    onClose();
  }

  const isCode = type === 'code';

  return (
    /* ── Backdrop ── */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* ── Dialog ── */}
      <div
        className="w-full max-w-3xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden"
        style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-6 py-5 shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex flex-col gap-2">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full self-start ${tagClass(type)}`}>
              {type.toUpperCase()}
              {isCode && language && (
                <span className="ml-2 opacity-75">· {language}</span>
              )}
            </span>
            <h2 className="text-xl font-bold leading-tight" style={{ color: 'var(--text-main)' }}>
              {title}
            </h2>
            {author && (
              <p className="text-xs font-medium" style={{ color: 'var(--accent-2)' }}>
                by {author}
              </p>
            )}
          {/* Tags */}
          {doc.data.tags && doc.data.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {doc.data.tags.map(tag => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: '#2e3352', color: 'var(--accent-2)' }}>#{tag}</span>
              ))}
            </div>
          )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 ml-4 shrink-0">
            {content && (
              <button onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
                style={{ background: copied ? '#1e4a3a' : 'var(--bg-card)', color: copied ? '#34d399' : 'var(--text-muted)', border: '1px solid var(--border)' }}>
                {copied ? '✓ Copied' : '⎘ Copy'}
              </button>
            )}
            <button onClick={() => onEdit(doc)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
              style={{ background: '#1e2a4a', color: '#818cf8', border: '1px solid #2e3352' }}>
              ✏️ Edit
            </button>
            <button onClick={handleDelete}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
              style={{ background: '#3d1e1e', color: '#f87171', border: '1px solid #7f1d1d' }}>
              ✕ Delete
            </button>
            <button onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition"
              style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              Close
            </button>
          </div>
        </div>

        {/* ── Content body ── */}
        <div className="flex-1 overflow-y-auto p-6">
          {content ? (
            isCode ? (
              /* Code block — monospace, preserves whitespace, horizontal scroll */
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                {/* Code header bar */}
                <div
                  className="flex items-center justify-between px-4 py-2 text-xs"
                  style={{ background: '#161820', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}
                >
                  <span>{language || 'Code'}</span>
                  <span>{content.split('\n').length} lines</span>
                </div>
                {/* Code content */}
                <pre
                  className="p-5 overflow-x-auto text-sm leading-relaxed"
                  style={{
                    background: '#0d0f14',
                    color: '#e2e8f0',
                    fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                    margin: 0,
                    whiteSpace: 'pre',
                    tabSize: 4,
                  }}
                >
                  <code>{content}</code>
                </pre>
              </div>
            ) : (
              /* Prose content */
              <div
                className="text-sm leading-7 whitespace-pre-wrap"
                style={{ color: 'var(--text-main)', lineHeight: '1.9' }}
              >
                {content}
              </div>
            )
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              No content saved for this document.
            </p>
          )}
        </div>

        {/* Footer with doc ID */}
        <div
          className="px-6 py-3 text-xs shrink-0"
          style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}
        >
          Document ID: #{doc.id}
        </div>
      </div>
    </div>
  );
}
