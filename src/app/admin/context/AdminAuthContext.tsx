"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';

interface AdminAuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
  resetActivityTimer: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [activityTimer, setActivityTimer] = useState<NodeJS.Timeout | null>(null);

  // Session timeout duration (1 hour = 60 minutes = 3600000 milliseconds)
  const SESSION_TIMEOUT = 60 * 60 * 1000;

  // Reset activity timer
  const resetActivityTimer = () => {
    setLastActivity(Date.now());
  };

  // Setup activity tracking
  useEffect(() => {
    const handleActivity = () => {
      resetActivityTimer();
    };

    // Track user activity events
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, []);

  // Check for session timeout
  useEffect(() => {
    const checkSessionTimeout = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;
      
      if (timeSinceLastActivity >= SESSION_TIMEOUT && user) {
        console.log('Session timeout - auto logging out');
        logout();
      }
    };

    // Check every minute
    const interval = setInterval(checkSessionTimeout, 60 * 1000);
    
    return () => clearInterval(interval);
  }, [lastActivity, user, SESSION_TIMEOUT]);

  // Handle logout
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      // Clear any stored session data
      localStorage.removeItem('adminSession');
      sessionStorage.clear();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Listen to authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Check if user has admin privileges
        user.getIdTokenResult().then((idTokenResult) => {
          if (idTokenResult.claims.admin) {
            setUser(user);
            resetActivityTimer();
            // Store session info
            localStorage.setItem('adminSession', JSON.stringify({
              uid: user.uid,
              email: user.email,
              lastActivity: Date.now()
            }));
          } else {
            // User is not admin, log them out
            logout();
          }
        }).catch(() => {
          // Error getting token, log out
          logout();
        });
      } else {
        setUser(null);
        localStorage.removeItem('adminSession');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    logout,
    resetActivityTimer
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
} 