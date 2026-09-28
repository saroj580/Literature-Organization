// ─────────────────────────────────────────────────────────────
// Sidebar.tsx — Left navigation panel with offline auth controls
// ─────────────────────────────────────────────────────────────

type NavItem = { label: string; value: string; emoji: string };

const NAV_ITEMS: NavItem[] = [
  { label: 'All Documents', value: '',        emoji: '📚' },
  { label: 'Code',          value: 'code',    emoji: '💻' },
  { label: 'Papers',        value: 'paper',   emoji: '📄' },
  { label: 'Diagrams',      value: 'diagram', emoji: '🗂️' },
  { label: 'Notes',         value: 'note',    emoji: '📝' },
];

interface SidebarProps {
  active: string;
  onSelect: (value: string) => void;
  onLockApp: () => void;
  onChangePassword: () => void;
  isLocked: boolean;
  setupRequired: boolean;
}

export default function Sidebar({
  active,
  onSelect,
  onLockApp,
  onChangePassword,
  isLocked,
  setupRequired,
}: SidebarProps) {
  return (
    <aside
      style={{ background: 'var(--bg-panel)', borderRight: '1px solid var(--border)' }}
      className="w-60 min-h-screen flex flex-col py-6 px-4 gap-2 shrink-0"
    >
      {/* App brand */}
      <div className="mb-6 px-2">
        <h1 className="text-lg font-bold tracking-tight" style={{ color: 'var(--accent-2)' }}>
          📖 Lit Organizer
        </h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          100% offline · private
        </p>
      </div>

      {/* Nav buttons */}
      <div className="flex flex-col gap-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.value;
          return (
            <button
              key={item.value}
              onClick={() => onSelect(item.value)}
              className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
              style={{
                background: isActive ? 'var(--accent)' : 'transparent',
                color: isActive ? '#fff' : 'var(--text-muted)',
              }}
            >
              <span>{item.emoji}</span>
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Auth & Security Status at bottom */}
      <div className="mt-auto pt-4 flex flex-col gap-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="px-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: setupRequired ? '#f59e0b' : isLocked ? '#f87171' : '#34d399' }}
            />
            <span className="text-xs font-semibold" style={{ color: 'var(--text-main)' }}>
              {setupRequired ? 'Setup Needed' : isLocked ? 'Locked' : 'Protected'}
            </span>
          </div>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded font-mono"
            style={{ background: 'var(--bg-card)', color: 'var(--accent-2)', border: '1px solid var(--border)' }}
          >
            JWT/AES
          </span>
        </div>

        {setupRequired ? (
          <button
            onClick={onLockApp}
            className="w-full text-xs font-semibold py-2.5 px-3 rounded-xl transition text-left flex items-center justify-center gap-2 hover:opacity-90 shadow-sm"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            <span>🛡️</span> Set Master Password
          </button>
        ) : isLocked ? (
          <button
            onClick={onLockApp}
            className="w-full text-xs font-semibold py-2.5 px-3 rounded-xl transition text-left flex items-center justify-center gap-2 hover:opacity-90 shadow-sm"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            <span>🔓</span> Unlock Workspace
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={onChangePassword}
              title="Change Master Password"
              className="flex-1 text-xs py-2 px-2 rounded-xl transition text-center flex items-center justify-center gap-1.5 hover:opacity-80"
              style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            >
              <span>🔑</span> Password
            </button>
            <button
              onClick={onLockApp}
              title="Lock Workspace"
              className="flex-1 text-xs py-2 px-2 rounded-xl transition text-center flex items-center justify-center gap-1.5 hover:text-red-400 hover:border-red-900"
              style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            >
              <span>🔒</span> Lock
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
