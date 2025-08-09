'use client';
import React, { useState } from 'react';
import { useAuth } from '../components/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const { register, signInWithGoogle, loading, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const router = useRouter();

  // Redirect if already logged in
  if (user) {
    router.push('/');
    return null;
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!acceptedTerms) {
      setError('Please accept the terms and conditions');
      return;
    }
    
    try {
      await register(email, password);
      setSuccess('Successfully registered!');
      setTimeout(() => router.push('/'), 1500);
    } catch (e: any) {
      console.error('Registration error:', e);
      if (e.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.');
      } else if (e.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters long.');
      } else if (e.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (e.code === 'auth/network-request-failed') {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(e.message || 'Something went wrong. Please try again.');
      }
    }
  };

  const handleGoogleRegister = async () => {
    setError(null);
    setSuccess(null);
    
    try {
      await signInWithGoogle();
      setSuccess('Successfully registered with Google!');
      setTimeout(() => router.push('/'), 1500);
    } catch (e: any) {
      console.error('Google registration error:', e);
      if (e.code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled. Please try again.');
      } else if (e.code === 'auth/unauthorized-domain') {
        setError('Please try again or contact support if the issue persists.');
      } else {
        setError(e.message || 'Google sign-in failed. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            INSTAKEY SUPPLY
          </Link>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Google Sign-In */}
          <div className="mb-6">
            <button
              type="button"
              onClick={handleGoogleRegister}
              disabled={loading}
              className="w-full flex justify-center items-center gap-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg py-3 px-4 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <svg className="w-5 h-5" viewBox="0 0 48 48">
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
          </div>

          {/* Divider */}
          <div className="flex items-center mb-6">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-3 text-gray-500 text-sm">or</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Create a password"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className="text-gray-700">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent('show-terms'))}
                    className="text-blue-600 hover:text-blue-500"
                  >
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent('show-privacy'))}
                    className="text-blue-600 hover:text-blue-500"
                  >
                    Privacy Policy
                  </button>
                </label>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                {success}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Already have an account?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/login"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign in to existing account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
