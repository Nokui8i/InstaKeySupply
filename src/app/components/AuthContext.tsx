'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
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
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
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
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      setUser(cred.user);
      const token = await cred.user.getIdTokenResult();
      setIsAdmin(!!token.claims.admin);
      return cred.user;
    } catch (e) {
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
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
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
    } catch (e) {
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