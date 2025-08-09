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

  // Only close when explicitly requested - no click-outside detection
  useEffect(() => {
    if (!open) {
      setShowPasswordReset(false);
    }
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Desktop: Dropdown */}
      <div className="absolute top-full right-0 mt-2 z-50">
        <div 
          ref={dropdownRef}
          className="bg-white rounded-lg shadow-2xl w-80 animate-scale-in"
        >
          {/* Desktop Header */}
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Sign In</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Desktop Content */}
          <div className="p-4">
            <AuthContent />
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      <PasswordResetModal 
        isOpen={showPasswordReset} 
        onClose={() => setShowPasswordReset(false)} 
      />
    </>
  );

  // Desktop content component
  function AuthContent() {
    if (!user) {
      return (
        <div className="space-y-3">
          {/* Google Sign-In */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg py-2.5 px-3 shadow-sm hover:bg-gray-50 transition-all duration-200 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
            onClick={async () => {
              console.log('Google sign-in button clicked');
              setError(null);
              setSuccess(null);
              try {
                console.log('Attempting Google sign-in...');
                await signInWithGoogle();
                console.log('Google sign-in successful!');
                setSuccess('Successfully logged in with Google!');
                setTimeout(() => onClose(), 1500);
              } catch (e: any) {
                console.error('Google sign-in error:', e);
                setError(e.message || 'Google sign-in failed');
              }
            }}
            disabled={loading}
          >
            <svg className="w-4 h-4" viewBox="0 0 48 48">
              <g>
                <path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.6l6.85-6.85C35.64 2.7 30.3 0 24 0 14.82 0 6.88 5.48 2.69 13.44l7.98 6.2C12.13 13.09 17.62 9.5 24 9.5z"/>
                <path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.42-4.74H24v9.04h12.4c-.54 2.9-2.18 5.36-4.65 7.04l7.18 5.59C43.98 37.13 46.1 31.36 46.1 24.55z"/>
                <path fill="#FBBC05" d="M10.67 28.09c-1.01-2.9-1.01-6.08 0-8.98l-7.98-6.2C.64 16.09 0 19.01 0 22c0 2.99.64 5.91 1.78 8.59l7.98-6.2z"/>
                <path fill="#EA4335" d="M24 44c6.3 0 11.58-2.09 15.44-5.7l-7.18-5.59c-2.01 1.35-4.59 2.15-8.26 2.15-6.38 0-11.87-3.59-14.33-8.73l-7.98 6.2C6.88 42.52 14.82 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </g>
            </svg>
            Continue with Google
          </button>
          
          {/* Terms and Conditions */}
          <div className="text-xs text-gray-500 text-center">
            By continuing, you agree to our
            <button type="button" className="text-blue-600 hover:underline mx-1 bg-transparent border-none p-0 cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('show-terms'))}>Terms</button>
            and
            <button type="button" className="text-blue-600 hover:underline ml-1 bg-transparent border-none p-0 cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('show-privacy'))}>Privacy Policy</button>
          </div>

          {/* Divider */}
          <div className="flex items-center">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-2 text-xs text-gray-500">or</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Tabs */}
          <div className="flex justify-center">
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                type="button"
                className={`px-2 py-1 font-medium rounded-md transition-all duration-200 text-xs ${tab === 'login' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
                onClick={() => setTab('login')}
                disabled={loading}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`px-2 py-1 font-medium rounded-md transition-all duration-200 text-xs ${tab === 'register' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
                onClick={() => setTab('register')}
                disabled={loading}
              >
                Sign Up
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={async (e) => {
            e.preventDefault();
            console.log('Form submitted:', { tab, email, password });
            setError(null);
            setSuccess(null);
            try {
              if (tab === 'login') {
                console.log('Attempting login...');
                await login(email, password);
                console.log('Login successful!');
                setSuccess('Successfully logged in!');
                setTimeout(() => onClose(), 1500);
              } else {
                console.log('Attempting registration...');
                await register(email, password);
                console.log('Registration successful!');
                setSuccess('Successfully registered!');
                setTimeout(() => onClose(), 1500);
              }
            } catch (e: any) {
              console.error('Auth error:', e);
              setError(e.message || 'Something went wrong');
            }
          }} 
          className="space-y-3">
            <div>
              <label className="block font-medium mb-1 text-gray-700 text-xs">Email</label>
              <input 
                type="email" 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="Enter your email"
                required 
                autoComplete="email"
                inputMode="email"
                autoCapitalize="none"
                spellCheck="false"
              />
            </div>
            <div>
              <label className="block font-medium mb-1 text-gray-700 text-xs">Password</label>
              <input 
                type="password" 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Enter your password"
                required 
                autoComplete="current-password"
                autoCapitalize="none"
                spellCheck="false"
              />
              {tab === 'login' && (
                <button
                  type="button"
                  onClick={() => setShowPasswordReset(true)}
                  className="text-blue-600 hover:text-blue-700 text-xs transition-colors"
                >
                  Forgot password?
                </button>
              )}
            </div>
            {tab === 'register' && (
              <div className="flex items-start gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  id="accept-terms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
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
            {error && (
              <div className="text-red-600 font-medium text-center text-xs bg-red-50 p-2 rounded-lg border border-red-200">
                {error}
              </div>
            )}
            {success && (
              <div className="text-green-600 font-medium text-center text-xs bg-green-50 p-2 rounded-lg border border-green-200">
                {success}
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold py-2.5 px-4 rounded-lg shadow-lg transition-all duration-200 text-sm active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || (tab === 'register' && !acceptedTerms)}
            >
              {loading ? (tab === 'login' ? 'Signing In...' : 'Creating Account...') : (tab === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>
        </div>
      );
    } else {
      return (
        <div className="w-full text-center space-y-3">
          <div className="text-sm font-medium text-blue-700 break-all">{user.email}</div>
          {isAdmin && (
            <a href="/admin" className="block w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-blue-700 hover:bg-blue-50 transition">
              Admin Panel
            </a>
          )}
          <button 
            onClick={logout} 
            className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold py-2.5 px-4 rounded-lg shadow-md transition-all duration-200 text-sm active:scale-95 focus:outline-none focus:ring-2 focus:ring-pink-300"
          >
            Sign Out
          </button>
        </div>
      );
    }
  }
} 