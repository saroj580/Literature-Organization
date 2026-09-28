// ─────────────────────────────────────────────────────────────
// AuthModal.tsx — First-Run Setup, Login & Password Management
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { setupAuth, loginAuth, changePassword } from './api';

export type AuthMode = 'setup' | 'login' | 'change_password';

interface Props {
  mode: AuthMode;
  canClose?: boolean;
  onSuccess: () => void;
  onClose?: () => void;
}

export default function AuthModal({ mode, canClose = false, onSuccess, onClose }: Props) {
  const currentMode = mode;
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!password) {
      setError('Please enter a password');
      return;
    }

    if (currentMode === 'setup' || currentMode === 'change_password') {
      if (password.length < 4) {
        setError('Password must be at least 4 characters');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    setLoading(true);
    try {
      if (currentMode === 'setup') {
        await setupAuth(username.trim() || 'admin', password);
        // Automatically log in after setup
        await loginAuth(username.trim() || 'admin', password);
        onSuccess();
      } else if (currentMode === 'login') {
        await loginAuth(username.trim() || 'admin', password);
        onSuccess();
      } else if (currentMode === 'change_password') {
        const res = await changePassword(username.trim() || 'admin', password);
        setSuccessMsg(res.message || 'Password changed successfully');
        setTimeout(() => {
          if (onClose) onClose();
        }, 1200);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const title =
    currentMode === 'setup'
      ? '🛡️ Setup Master Password'
      : currentMode === 'login'
      ? '🔐 Unlock Workspace'
      : '🔑 Change Master Password';

  const subtitle =
    currentMode === 'setup'
      ? 'Set up a local password to encrypt and secure your offline research library.'
      : currentMode === 'login'
      ? 'Enter your master password to decrypt and view your documents.'
      : 'Update the master password for your offline database.';

  const inputStyle = {
    background: 'var(--bg-base)',
    border: '1px solid var(--border)',
    color: 'var(--text-main)',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(5, 7, 12, 0.85)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => canClose && e.target === e.currentTarget && onClose && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl p-7 flex flex-col gap-5 shadow-2xl relative"
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        }}
      >
        {canClose && onClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-lg opacity-60 hover:opacity-100 transition"
            style={{ color: 'var(--text-muted)' }}
          >
            ✕
          </button>
        )}

        {/* Header */}
        <div className="flex flex-col gap-1.5 text-center">
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-2xl mb-1"
               style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
            {currentMode === 'setup' ? '🛡️' : '🔒'}
          </div>
          <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>
            {title}
          </h2>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {subtitle}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          {/* Username */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username (default: admin)"
              className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
              style={inputStyle}
              autoFocus={currentMode === 'setup'}
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                {currentMode === 'change_password' ? 'New Password' : 'Password'}
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs opacity-75 hover:opacity-100 transition"
                style={{ color: 'var(--accent-2)' }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter master password"
              className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
              style={inputStyle}
              autoFocus={currentMode === 'login'}
            />
          </div>

          {/* Confirm Password (Setup & Change Password) */}
          {(currentMode === 'setup' || currentMode === 'change_password') && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                style={inputStyle}
              />
            </div>
          )}

          {/* Error & Success Messages */}
          {error && (
            <div
              className="p-3 rounded-xl text-xs flex items-center gap-2"
              style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}
            >
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div
              className="p-3 rounded-xl text-xs flex items-center gap-2"
              style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.3)' }}
            >
              <span>✓</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-sm transition hover:opacity-95 active:scale-[0.99] flex items-center justify-center gap-2 mt-2"
            style={{
              background: 'linear-gradient(135deg, var(--accent), #4f46e5)',
              color: '#ffffff',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : currentMode === 'setup' ? (
              'Save & Unlock'
            ) : currentMode === 'login' ? (
              'Unlock Library'
            ) : (
              'Update Password'
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="pt-2 text-center" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            🔒 100% Offline Authentication · Passwords hashed with bcrypt in local SQLite.
          </p>
        </div>
      </div>
    </div>
  );
}
