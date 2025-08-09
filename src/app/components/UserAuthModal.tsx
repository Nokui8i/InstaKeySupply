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
      {/* Mobile: Clean, simple modal */}
      <div className="md:hidden fixed inset-0 z-[9999] bg-black/60">
        <div className="min-h-screen flex items-center justify-center p-4" style={{ minHeight: '100dvh' }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xs" style={{ transform: 'translateZ(0)' }}>
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Sign In</h2>
              <button
                onClick={onClose}
                className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Mobile Content */}
            <div className="p-4">
              <MobileAuthContent />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: Dropdown */}
      <div className="hidden md:block absolute top-full right-0 mt-2 z-50">
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

  // Mobile-specific content component
  function MobileAuthContent() {
    if (!user) {
      return (
        <div className="space-y-4">
          {/* Google Sign-In - Smaller Design */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 rounded-lg py-3 px-4 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onClick={async () => {
              console.log('Mobile Google sign-in button clicked');
              setError(null);
              setSuccess(null);
              try {
                console.log('Attempting mobile Google sign-in...');
                await signInWithGoogle();
                console.log('Mobile Google sign-in successful!');
                setSuccess('Successfully logged in with Google!');
                setTimeout(() => onClose(), 1500);
              } catch (e: any) {
                console.error('Mobile Google sign-in error:', e);
                if (e.code === 'auth/popup-closed-by-user') {
                  setError('Sign-in was cancelled. Please try again.');
                } else if (e.code === 'auth/unauthorized-domain') {
                  setError('Please try again or contact support if the issue persists.');
                } else {
                  setError(e.message || 'Google sign-in failed. Please try again.');
                }
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

          {/* Divider */}
          <div className="flex items-center">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-3 text-gray-500 text-xs font-medium">or</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* Tabs - Smaller Design */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              className={`flex-1 py-2 px-3 rounded-md font-medium text-xs transition-all duration-200 ${
                tab === 'login' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => {
                setTab('login');
                setError(null);
                setSuccess(null);
              }}
              disabled={loading}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`flex-1 py-2 px-3 rounded-md font-medium text-xs transition-all duration-200 ${
                tab === 'register' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => {
                setTab('register');
                setError(null);
                setSuccess(null);
              }}
              disabled={loading}
            >
              Sign Up
            </button>
          </div>

          {/* Form - Fixed and Smaller */}
          <form onSubmit={async (e) => {
            e.preventDefault();
            console.log('Mobile form submitted:', { tab, email, password });
            setError(null);
            setSuccess(null);
            try {
              if (tab === 'login') {
                console.log('Attempting mobile login...');
                await login(email, password);
                console.log('Mobile login successful!');
                setSuccess('Successfully logged in!');
                setTimeout(() => onClose(), 1500);
              } else {
                console.log('Attempting mobile registration...');
                await register(email, password);
                console.log('Mobile registration successful!');
                setSuccess('Successfully registered!');
                setTimeout(() => onClose(), 1500);
              }
            } catch (e: any) {
              console.error('Mobile auth error:', e);
              if (e.code === 'auth/invalid-credential') {
                setError('Invalid email or password. Please try again.');
              } else if (e.code === 'auth/user-not-found') {
                setError('No account found with this email address.');
              } else if (e.code === 'auth/wrong-password') {
                setError('Incorrect password. Please try again.');
              } else if (e.code === 'auth/email-already-in-use') {
                setError('An account with this email already exists.');
              } else if (e.code === 'auth/weak-password') {
                setError('Password should be at least 6 characters long.');
              } else if (e.code === 'auth/network-request-failed') {
                setError('Network error. Please check your connection and try again.');
              } else if (e.code === 'auth/unauthorized-domain') {
                setError('Please try again or contact support if the issue persists.');
              } else {
                setError(e.message || 'Something went wrong. Please try again.');
              }
            }
          }} 
          className="space-y-3">
            <div>
              <label className="block text-gray-700 font-medium mb-1 text-xs">Email</label>
              <input 
                type="email" 
                className="w-full bg-white border-2 border-gray-200 rounded-lg px-3 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="Enter your email"
                required 
                autoComplete="email"
                inputMode="email"
                autoCapitalize="none"
                spellCheck="false"
                autoCorrect="off"
                data-form-type="other"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1 text-xs">Password</label>
              <input 
                type="password" 
                className="w-full bg-white border-2 border-gray-200 rounded-lg px-3 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Enter your password"
                required 
                autoComplete="current-password"
                autoCapitalize="none"
                spellCheck="false"
                autoCorrect="off"
                data-form-type="other"
              />
              {tab === 'login' && (
                <button
                  type="button"
                  onClick={() => setShowPasswordReset(true)}
                  className="text-blue-600 hover:text-blue-700 text-xs transition-colors mt-1"
                >
                  Forgot password?
                </button>
              )}
            </div>
            {tab === 'register' && (
              <div className="flex items-start gap-2 text-gray-600 text-xs">
                <input
                  type="checkbox"
                  id="accept-terms-mobile"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="rounded border-gray-300 focus:ring-blue-500 mt-0.5"
                  required
                />
                <label htmlFor="accept-terms-mobile" className="select-none">
                  I agree to the
                  <button type="button" className="text-blue-600 hover:underline mx-1 bg-transparent border-none p-0 cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('show-terms'))}>Terms</button>
                  and
                  <button type="button" className="text-blue-600 hover:underline ml-1 bg-transparent border-none p-0 cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('show-privacy'))}>Privacy Policy</button>
                </label>
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 font-medium text-center text-xs p-3 rounded-lg">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 font-medium text-center text-xs p-3 rounded-lg">
                {success}
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="text-gray-900 font-medium break-all text-sm">{user.email}</div>
          {isAdmin && (
            <a href="/admin" className="block w-full bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-blue-700 font-medium hover:bg-blue-100 transition text-sm">
              Admin Panel
            </a>
          )}
          <button 
            onClick={logout} 
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Sign Out
          </button>
        </div>
      );
    }
  }

  // Desktop content component (unchanged)
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