'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import PasswordResetModal from './PasswordResetModal';

export default function UserAuthDropdown({ open, onClose, anchorRef }: { open: boolean; onClose: () => void; anchorRef: React.RefObject<HTMLButtonElement> }) {
  const { login, register, loading, user, logout, signInWithGoogle, isAdmin } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  // Close on outside click
  useEffect(() => {
    if (!open) {
      // Reset password reset state when modal closes
      setShowPasswordReset(false);
      return;
    }
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        (!anchorRef.current || !anchorRef.current.contains(e.target as Node))
      ) {
        onClose();
        // Reset password reset state when closing
        setShowPasswordReset(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return (
    <div ref={dropdownRef} className="absolute right-0 mt-2 w-72 max-w-xs bg-white rounded-xl shadow-xl border border-gray-200 z-50 animate-scale-in p-4">
      {/* Google button */}
      {!user && (
        <>
          <div className="text-[11px] text-gray-500 text-center mb-1">
            By continuing, you agree to our
            <button type="button" className="text-blue-600 hover:underline mx-1 bg-transparent border-none p-0 cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('show-terms'))}>Terms</button>
            and
            <button type="button" className="text-blue-600 hover:underline ml-1 bg-transparent border-none p-0 cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('show-privacy'))}>Privacy Policy</button>.
          </div>
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-full py-1 px-2 mb-3 shadow-sm hover:bg-gray-50 transition-all duration-200 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            onClick={async () => {
              setError(null);
              setSuccess(null);
              try {
                await signInWithGoogle();
                setSuccess('Logged in!');
                onClose();
              } catch (e: any) {
                setError(e.message || 'Google sign-in failed');
              }
            }}
            disabled={loading}
          >
            <svg className="w-4 h-4" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.6l6.85-6.85C35.64 2.7 30.3 0 24 0 14.82 0 6.88 5.48 2.69 13.44l7.98 6.2C12.13 13.09 17.62 9.5 24 9.5z"/><path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.42-4.74H24v9.04h12.4c-.54 2.9-2.18 5.36-4.65 7.04l7.18 5.59C43.98 37.13 46.1 31.36 46.1 24.55z"/><path fill="#FBBC05" d="M10.67 28.09c-1.01-2.9-1.01-6.08 0-8.98l-7.98-6.2C.64 16.09 0 19.01 0 22c0 2.99.64 5.91 1.78 8.59l7.98-6.2z"/><path fill="#EA4335" d="M24 44c6.3 0 11.58-2.09 15.44-5.7l-7.18-5.59c-2.01 1.35-4.59 2.15-8.26 2.15-6.38 0-11.87-3.59-14.33-8.73l-7.98 6.2C6.88 42.52 14.82 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></g></svg>
            Continue with Google
          </button>
        </>
      )}
      <div className="flex justify-center mb-3 w-full">
        <button
          className={`flex-1 px-1 py-1 font-semibold rounded-l-xl transition-all duration-200 text-xs ${tab === 'login' ? 'bg-blue-600 text-white shadow-md scale-105' : 'bg-gray-100 text-gray-700 hover:bg-blue-50'}`}
          onClick={() => setTab('login')}
          disabled={loading}
        >
          Login
        </button>
        <button
          className={`flex-1 px-1 py-1 font-semibold rounded-r-xl transition-all duration-200 text-xs ${tab === 'register' ? 'bg-blue-600 text-white shadow-md scale-105' : 'bg-gray-100 text-gray-700 hover:bg-blue-50'}`}
          onClick={() => setTab('register')}
          disabled={loading}
        >
          Register
        </button>
      </div>
      {user ? (
        <div className="w-full text-center space-y-3">
          <div className="text-sm font-semibold text-blue-700 break-all">{user.email}</div>
          {isAdmin && (
            <a href="/admin" className="block w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-blue-700 hover:bg-blue-50 transition mb-1">Admin Panel</a>
          )}
          <button onClick={logout} className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold py-1 px-1 rounded-full shadow-md transition-all duration-200 text-xs active:scale-95 focus:outline-none focus:ring-2 focus:ring-pink-300">Logout</button>
        </div>
      ) : (
        <form onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setSuccess(null);
          try {
            if (tab === 'login') {
              await login(email, password);
              setSuccess('Logged in!');
              onClose();
            } else {
              await register(email, password);
              setSuccess('Registered!');
              onClose();
            }
          } catch (e: any) {
            setError(e.message || 'Something went wrong');
          }
        }} className="w-full space-y-2">
          <div>
            <label className="block font-semibold mb-1 text-gray-700 text-xs">Email</label>
            <input type="email" className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
          </div>
          <div>
            <label className="block font-semibold mb-1 text-gray-700 text-xs">Password</label>
            <input type="password" className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200" value={password} onChange={e => setPassword(e.target.value)} required />
            {tab === 'login' && (
              <button
                type="button"
                onClick={() => setShowPasswordReset(true)}
                className="text-blue-600 hover:text-blue-700 text-xs mt-1 transition-colors"
              >
                Forgot Password?
              </button>
            )}
          </div>
          {tab === 'register' && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <input
                type="checkbox"
                id="accept-terms"
                checked={acceptedTerms}
                onChange={e => setAcceptedTerms(e.target.checked)}
                className="rounded border-gray-300 focus:ring-blue-400"
                required
              />
              <label htmlFor="accept-terms" className="select-none">
                I agree to the
                <button type="button" className="text-blue-600 hover:underline ml-1 bg-transparent border-none p-0 cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('show-terms'))}>Terms</button>
                and
                <button type="button" className="text-blue-600 hover:underline ml-1 bg-transparent border-none p-0 cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('show-privacy'))}>Privacy Policy</button>
              </label>
            </div>
          )}
          {error && <div className="text-red-600 font-semibold text-center text-xs">{error}</div>}
          {success && <div className="text-green-600 font-semibold text-center text-xs">{success}</div>}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold py-1 px-1 rounded-full shadow-lg transition-all duration-200 text-xs active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-300"
            disabled={loading || (tab === 'register' && !acceptedTerms)}
          >
            {loading ? (tab === 'login' ? 'Logging in...' : 'Registering...') : (tab === 'login' ? 'Login' : 'Register')}
          </button>
        </form>
      )}
      <style jsx global>{`
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in {
          animation: scale-in 0.2s cubic-bezier(0.4,0,0.2,1);
        }
      `}</style>

      {/* Password Reset Modal */}
      <PasswordResetModal 
        isOpen={showPasswordReset} 
        onClose={() => setShowPasswordReset(false)} 
      />
    </div>
  );
} 