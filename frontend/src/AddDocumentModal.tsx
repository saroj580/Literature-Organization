// ─────────────────────────────────────────────────────────────
// AddDocumentModal.tsx — Create OR Edit a document
//
// DUAL MODE:
//   • No `initialDoc` prop  → Create mode ("Add Document")
//   • With `initialDoc` prop → Edit mode  ("Edit Document"),
//     all fields pre-filled from existing data
//
// TAGS:
//   Type a tag and press Enter or comma to add it.
//   Tags render as coloured pills with an × remove button.
//   Stored as string[] in the JSON metadata.
//
// AUTO LANGUAGE DETECTION:
//   Fires on paste (immediately) and on typing (400ms debounce).
//   Shows a "✦ auto-detected" badge. User can override.
// ─────────────────────────────────────────────────────────────

import { useState, useRef } from 'react';
import type { Doc, DocumentMeta } from './types';
import { detectLanguage } from './detectLanguage';

interface Props {
  initialDoc?: Doc;                          // provided in Edit mode
  onSave: (meta: DocumentMeta) => Promise<void>;
  onClose: () => void;
}

export default function AddDocumentModal({ initialDoc, onSave, onClose }: Props) {
  const init = initialDoc?.data;
  const isEdit = !!initialDoc;

  const [title,    setTitle]    = useState(init?.title    ?? '');
  const [type,     setType]     = useState<DocumentMeta['type']>(init?.type ?? 'code');
  const [content,  setContent]  = useState(init?.content  ?? '');
  const [language, setLanguage] = useState(init?.language ?? '');
  const [author,   setAuthor]   = useState(init?.author   ?? '');
  const [tags,     setTags]     = useState<string[]>(init?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [detected, setDetected] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Language auto-detection ─────────────────────────────────
  function runDetection(code: string) {
    if (type !== 'code') return;
    const lang = detectLanguage(code);
    if (lang) { setLanguage(lang); setDetected(true); }
    else { setDetected(false); }
  }
  function handleContentChange(value: string) {
    setContent(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runDetection(value), 400);
  }
  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const pasted = e.clipboardData.getData('text');
    if (pasted) setTimeout(() => runDetection(pasted), 0);
  }

  // ── Tags ─────────────────────────────────────────────────────
  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase().replace(/,/g, '');
    if (tag && !tags.includes(tag)) setTags(prev => [...prev, tag]);
    setTagInput('');
  }
  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput); }
    if (e.key === 'Backspace' && !tagInput && tags.length > 0)
      setTags(prev => prev.slice(0, -1));
  }
  function removeTag(tag: string) { setTags(prev => prev.filter(t => t !== tag)); }

  // ── Type change ──────────────────────────────────────────────
  function handleTypeChange(t: DocumentMeta['type']) {
    setType(t); setDetected(false);
    if (t !== 'code') setLanguage('');
    if (t !== 'paper') setAuthor('');
  }

  // ── Submit ───────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    const meta: DocumentMeta = {
      title: title.trim(), type,
      content:  content.trim()  || undefined,
      language: type === 'code'  ? language.trim() || undefined : undefined,
      author:   type === 'paper' ? author.trim()   || undefined : undefined,
      tags:     tags.length > 0  ? tags : undefined,
    };
    setSaving(true);
    try { await onSave(meta); }
    catch { setError('Failed to save. Is the backend running on port 8000?'); }
    finally { setSaving(false); }
  }

  const inputCls   = "w-full rounded-lg px-3 py-2.5 text-sm outline-none transition";
  const inputStyle = { background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-main)' } as React.CSSProperties;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-6 flex flex-col gap-5 max-h-[92vh] overflow-y-auto"
        style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">{isEdit ? '✏️ Edit Document' : 'Add Document'}</h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Type selector */}
          <div className="flex gap-2">
            {(['code', 'paper', 'diagram', 'note'] as const).map((t) => (
              <button key={t} type="button" onClick={() => handleTypeChange(t)}
                className="flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition"
                style={{ background: type === t ? 'var(--accent)' : 'var(--bg-card)', color: type === t ? '#fff' : 'var(--text-muted)', border: '1px solid var(--border)' }}
              >{t}</button>
            ))}
          </div>

          {/* Title */}
          <input className={inputCls} style={inputStyle} placeholder="Title *"
            value={title} onChange={e => setTitle(e.target.value)} />

          {/* Language (code only) */}
          {type === 'code' && (
            <div className="relative">
              <input className={inputCls}
                style={{ ...inputStyle, paddingRight: detected ? '120px' : undefined }}
                placeholder="Language (auto-detected from code)"
                value={language} onChange={e => { setLanguage(e.target.value); setDetected(false); }}
              />
              {detected && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-0.5 rounded-full pointer-events-none"
                  style={{ background: '#1e3a5f', color: '#60a5fa' }}>✦ auto-detected</span>
              )}
            </div>
          )}

          {/* Author (paper only) */}
          {type === 'paper' && (
            <input className={inputCls} style={inputStyle} placeholder="Author(s)"
              value={author} onChange={e => setAuthor(e.target.value)} />
          )}

          {/* Content */}
          <textarea className={inputCls}
            style={{ ...inputStyle, resize: 'vertical',
              fontFamily: type === 'code' ? "'Fira Code','Consolas',monospace" : 'inherit',
              fontSize: type === 'code' ? '13px' : '14px' }}
            placeholder={
              type === 'code' ? 'Paste your code — language will be detected automatically…'
              : type === 'paper' ? 'Abstract or summary…'
              : type === 'diagram' ? 'Describe what this diagram shows…'
              : 'Your note…' }
            rows={type === 'code' ? 8 : 5}
            value={content}
            onChange={e => handleContentChange(e.target.value)}
            onPaste={handlePaste}
          />

          {/* Tags input */}
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
              Tags <span className="opacity-60">(press Enter or comma to add)</span>
            </label>
            <div className="flex flex-wrap gap-1.5 p-2 rounded-lg min-h-[42px]"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
              {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                  style={{ background: '#2e3352', color: 'var(--accent-2)' }}>
                  #{tag}
                  <button type="button" onClick={() => removeTag(tag)}
                    className="opacity-60 hover:opacity-100 ml-0.5">×</button>
                </span>
              ))}
              <input
                className="flex-1 min-w-[120px] bg-transparent text-sm outline-none"
                style={{ color: 'var(--text-main)' }}
                placeholder={tags.length === 0 ? 'e.g. auth, jwt, fastapi' : ''}
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={() => tagInput.trim() && addTag(tagInput)}
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-lg text-sm"
              style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition"
              style={{ background: 'var(--accent)', color: '#fff', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Save Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
