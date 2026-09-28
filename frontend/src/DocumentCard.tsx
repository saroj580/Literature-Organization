// ─────────────────────────────────────────────────────────────
// DocumentCard.tsx — Clickable document card
//
// CHANGES from v1:
//   - Entire card is now a button → clicking opens detail modal
//   - Delete button still works independently (stopPropagation
//     so clicking delete doesn't also open the detail view)
//   - Visual: cursor-pointer + stronger hover lift
// ─────────────────────────────────────────────────────────────

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
  onClick: (doc: Doc) => void;
  onDelete: (id: number) => void;
}

export default function DocumentCard({ doc, onClick, onDelete }: Props) {
  const { title, type, content, language, author } = doc.data;

  const subtitle =
    type === 'code'  && language ? `${language}`
    : type === 'paper' && author   ? `by ${author}`
    : '';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(doc)}
      onKeyDown={(e) => e.key === 'Enter' && onClick(doc)}
      className="rounded-xl p-5 flex flex-col gap-3 group transition-all duration-200 cursor-pointer hover:shadow-xl hover:scale-[1.02] hover:-translate-y-0.5 focus:outline-none focus:ring-2"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Header: badge + delete */}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${tagClass(type)}`}>
          {type.toUpperCase()}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(doc.id); }}
          title="Delete document"
          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs px-2 py-1 rounded"
          style={{ background: '#3d1e1e', color: '#f87171' }}
        >
          ✕
        </button>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-base leading-tight" style={{ color: 'var(--text-main)' }}>
        {title}
      </h3>

      {/* Content preview — truncated, full view in detail modal */}
      {content && (
        <p
          className="text-sm leading-relaxed line-clamp-3"
          style={{
            color: 'var(--text-muted)',
            fontFamily: type === 'code' ? "'Fira Code','Consolas',monospace" : 'inherit',
            fontSize: type === 'code' ? '12px' : '14px',
          }}
        >
          {content}
        </p>
      )}

      {/* Footer: subtitle + tags + hint */}
      <div className="flex flex-col gap-2 mt-auto pt-1">
        {subtitle && (
          <p className="text-xs" style={{ color: 'var(--accent-2)' }}>{subtitle}</p>
        )}
        {doc.data.tags && doc.data.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {doc.data.tags.map(tag => (
              <span key={tag} className="text-xs px-1.5 py-0.5 rounded-full"
                style={{ background: '#2e3352', color: 'var(--accent-2)' }}>#{tag}</span>
            ))}
          </div>
        )}
        <p className="text-xs ml-auto opacity-0 group-hover:opacity-60 transition-opacity"
          style={{ color: 'var(--text-muted)' }}>Click to expand →</p>
      </div>
    </div>
  );
}
