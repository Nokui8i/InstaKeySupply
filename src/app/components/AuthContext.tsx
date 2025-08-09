'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, sendPasswordResetEmail } from 'firebase/auth';
import { app } from '../../firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  register: (email: string, password: string) => Promise<User | null>;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<User | null>;
  resetPassword: (email: string) => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const auth = getAuth(app);

  useEffect(() => {
    // Handle redirect result for mobile Google sign-in
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          console.log('AuthContext: Redirect result successful, user:', result.user.email);
          setUser(result.user);
          const token = await result.user.getIdTokenResult();
          setIsAdmin(!!token.claims.admin);
          
          // Add user to email marketing list since they agreed to terms
          try {
            if (result.user.email) {
              console.log('Adding redirect user to email marketing list:', result.user.email);
              const response = await fetch('/api/collect-email', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  email: result.user.email,
                  phone: null,
                  source: 'google_redirect_signin'
                }),
              });
              
              if (!response.ok) {
                const errorData = await response.json();
                console.error('Email marketing API error:', errorData);
              } else {
                const result = await response.json();
                console.log('Successfully added redirect user to email marketing list:', result);
              }
            }
          } catch (error) {
            console.error('Failed to add redirect user to email marketing list:', error);
          }
        }
      } catch (error) {
        console.error('AuthContext: Redirect result error:', error);
      }
    };

    handleRedirectResult();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
      if (user) {
        const token = await user.getIdTokenResult();
        setIsAdmin(!!token.claims.admin);
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, [auth]);

  const register = async (email: string, password: string) => {
    console.log('AuthContext: register called with email:', email);
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      console.log('AuthContext: register successful, user:', cred.user.email);
      setUser(cred.user);
      const token = await cred.user.getIdTokenResult();
      setIsAdmin(!!token.claims.admin);
      
      // Add user to email marketing list since they agreed to terms
      try {
        if (email) {
          console.log('Adding user to email marketing list:', email);
          const response = await fetch('/api/collect-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: email,
              phone: null,
              source: 'user_registration'
            }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error('Email marketing API error:', errorData);
          } else {
            const result = await response.json();
            console.log('Successfully added to email marketing list:', result);
          }
        } else {
          console.warn('User has no email address, skipping email marketing list');
        }
      } catch (error) {
        console.error('Failed to add user to email marketing list:', error);
        // Don't fail registration if email marketing fails
      }
      
      return cred.user;
    } catch (e) {
      setLoading(false);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    console.log('AuthContext: login called with email:', email);
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      console.log('AuthContext: login successful, user:', cred.user.email);
      setUser(cred.user);
      const token = await cred.user.getIdTokenResult();
      setIsAdmin(!!token.claims.admin);
      return cred.user;
    } catch (e) {
      console.error('AuthContext: login error:', e);
      setLoading(false);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    await signOut(auth);
    setUser(null);
    setLoading(false);
  };

  const signInWithGoogle = async () => {
    console.log('AuthContext: Google sign-in called');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      
      // Add custom parameters for better mobile support
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      // Check if we're on mobile and use redirect instead of popup
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      console.log('AuthContext: Device detection - Mobile:', isMobile, 'iOS:', isIOS);
      
      if (isMobile) {
        console.log('AuthContext: Using redirect for mobile Google sign-in');
        try {
          await signInWithRedirect(auth, provider);
          return null; // Will redirect, so return null
        } catch (redirectError) {
          console.error('AuthContext: Redirect failed, trying popup as fallback:', redirectError);
          // Fallback to popup if redirect fails
          const cred = await signInWithPopup(auth, provider);
          console.log('AuthContext: Fallback popup successful, user:', cred.user.email);
          setUser(cred.user);
          const token = await cred.user.getIdTokenResult();
          setIsAdmin(!!token.claims.admin);
          return cred.user;
        }
      } else {
        console.log('AuthContext: Using popup for desktop Google sign-in');
        const cred = await signInWithPopup(auth, provider);
        console.log('AuthContext: Google sign-in successful, user:', cred.user.email);
        setUser(cred.user);
        const token = await cred.user.getIdTokenResult();
        setIsAdmin(!!token.claims.admin);
        
        // Add user to email marketing list since they agreed to terms
        try {
          if (cred.user.email) {
            console.log('Adding Google user to email marketing list:', cred.user.email);
            const response = await fetch('/api/collect-email', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: cred.user.email,
                phone: null,
                source: 'google_signin'
              }),
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              console.error('Email marketing API error:', errorData);
            } else {
              const result = await response.json();
              console.log('Successfully added Google user to email marketing list:', result);
            }
          } else {
            console.warn('Google user has no email address, skipping email marketing list');
          }
        } catch (error) {
          console.error('Failed to add user to email marketing list:', error);
          // Don't fail sign-in if email marketing fails
        }
        
        return cred.user;
      }
    } catch (e) {
      console.error('AuthContext: Google sign-in error:', e);
      setLoading(false);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (e) {
      throw e;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, signInWithGoogle, resetPassword, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}; 