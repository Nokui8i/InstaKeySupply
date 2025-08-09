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
      {/* Mobile: Full screen modal with mobile-optimized design */}
      <div className="md:hidden fixed inset-0 z-[9999] bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
        <div className="min-h-screen flex flex-col">
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-4 pt-12">
            <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mobile Content */}
          <div className="flex-1 flex items-center justify-center px-6 pb-8">
            <div className="w-full max-w-sm">
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
        <div className="space-y-6">
          {/* Domain Warning Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-800">Security Notice</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  You may see a security warning. This is normal for mobile devices. Your login is secure.
                </p>
              </div>
            </div>
          </div>

          {/* Google Sign-In - Mobile Optimized */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 rounded-2xl py-4 px-6 shadow-lg hover:shadow-xl transition-all duration-200 text-base font-semibold focus:outline-none focus:ring-4 focus:ring-blue-300 active:scale-95"
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
                // Handle specific mobile errors
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
            <svg className="w-6 h-6" viewBox="0 0 48 48">
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
            <div className="flex-1 border-t border-white/20"></div>
            <span className="px-4 text-white/60 text-sm font-medium">or</span>
            <div className="flex-1 border-t border-white/20"></div>
          </div>

          {/* Tabs - Mobile Optimized */}
          <div className="flex bg-white/10 rounded-2xl p-1">
            <button
              type="button"
              className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${
                tab === 'login' 
                  ? 'bg-white text-blue-900 shadow-lg' 
                  : 'text-white/80 hover:text-white'
              }`}
              onClick={() => setTab('login')}
              disabled={loading}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${
                tab === 'register' 
                  ? 'bg-white text-blue-900 shadow-lg' 
                  : 'text-white/80 hover:text-white'
              }`}
              onClick={() => setTab('register')}
              disabled={loading}
            >
              Sign Up
            </button>
          </div>

          {/* Form - Mobile Optimized */}
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
              // Handle specific mobile errors
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
          className="space-y-4">
            <div>
              <label className="block text-white font-semibold mb-2 text-sm">Email</label>
              <input 
                type="email" 
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200 text-base" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="Enter your email"
                required 
                autoFocus 
              />
            </div>
            <div>
              <label className="block text-white font-semibold mb-2 text-sm">Password</label>
              <input 
                type="password" 
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200 text-base" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="Enter your password"
                required 
              />
              {tab === 'login' && (
                <button
                  type="button"
                  onClick={() => setShowPasswordReset(true)}
                  className="text-white/80 hover:text-white text-sm transition-colors mt-2"
                >
                  Forgot password?
                </button>
              )}
            </div>
            {tab === 'register' && (
              <div className="flex items-start gap-3 text-white/80 text-sm">
                <input
                  type="checkbox"
                  id="accept-terms-mobile"
                  checked={acceptedTerms}
                  onChange={e => setAcceptedTerms(e.target.checked)}
                  className="rounded border-white/30 focus:ring-white/50 mt-1"
                  required
                />
                <label htmlFor="accept-terms-mobile" className="select-none">
                  I agree to the
                  <button type="button" className="text-white hover:underline mx-1 bg-transparent border-none p-0 cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('show-terms'))}>Terms</button>
                  and
                  <button type="button" className="text-white hover:underline ml-1 bg-transparent border-none p-0 cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('show-privacy'))}>Privacy Policy</button>
                </label>
              </div>
            )}
            {error && (
              <div className="bg-red-500/20 border border-red-400/30 text-red-100 font-medium text-center text-sm p-4 rounded-xl">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-500/20 border border-green-400/30 text-green-100 font-medium text-center text-sm p-4 rounded-xl">
                {success}
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 text-base active:scale-95 focus:outline-none focus:ring-4 focus:ring-blue-300/50 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || (tab === 'register' && !acceptedTerms)}
            >
              {loading ? (tab === 'login' ? 'Signing In...' : 'Creating Account...') : (tab === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>
        </div>
      );
    } else {
      return (
        <div className="w-full text-center space-y-4">
          <div className="text-white font-semibold break-all text-lg">{user.email}</div>
          {isAdmin && (
            <a href="/admin" className="block w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white font-semibold hover:bg-white/20 transition">
              Admin Panel
            </a>
          )}
          <button 
            onClick={logout} 
            className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 text-base active:scale-95 focus:outline-none focus:ring-4 focus:ring-red-300/50"
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
                onChange={e => setEmail(e.target.value)} 
                placeholder="Enter your email"
                required 
                autoFocus 
              />
            </div>
            <div>
              <label className="block font-medium mb-1 text-gray-700 text-xs">Password</label>
              <input 
                type="password" 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="Enter your password"
                required 
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