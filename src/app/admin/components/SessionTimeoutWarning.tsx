"use client";
import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';

interface SessionTimeoutWarningProps {
  warningTime?: number; // Time in milliseconds before logout to show warning
}

export default function SessionTimeoutWarning({ warningTime = 5 * 60 * 1000 }: SessionTimeoutWarningProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const { resetActivityTimer, logout } = useAdminAuth();

  useEffect(() => {
    let countdownInterval: NodeJS.Timeout;

    const checkSessionTimeout = () => {
      const lastActivity = localStorage.getItem('adminSession');
      if (lastActivity) {
        try {
          const sessionData = JSON.parse(lastActivity);
          const timeSinceLastActivity = Date.now() - sessionData.lastActivity;
          const sessionTimeout = 60 * 60 * 1000; // 1 hour
          const timeUntilLogout = sessionTimeout - timeSinceLastActivity;

          if (timeUntilLogout <= warningTime && timeUntilLogout > 0) {
            setShowWarning(true);
            setTimeLeft(Math.ceil(timeUntilLogout / 1000));

            // Start countdown
            countdownInterval = setInterval(() => {
              setTimeLeft(prev => {
                if (prev <= 1) {
                  logout();
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);
          } else if (timeUntilLogout <= 0) {
            logout();
          }
        } catch (error) {
          console.error('Error parsing session data:', error);
        }
      }
    };

    // Check every 30 seconds
    const interval = setInterval(checkSessionTimeout, 30 * 1000);
    
    // Initial check
    checkSessionTimeout();

    return () => {
      clearInterval(interval);
      clearInterval(countdownInterval);
    };
  }, [warningTime, logout]);

  const handleStayLoggedIn = () => {
    resetActivityTimer();
    setShowWarning(false);
    setTimeLeft(0);
  };

  const handleLogout = () => {
    logout();
  };

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">
              Session Timeout Warning
            </h3>
          </div>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Your session will expire in <span className="font-semibold text-red-600">{timeLeft}</span> seconds due to inactivity.
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Click "Stay Logged In" to continue your session.
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleStayLoggedIn}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Stay Logged In
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors"
          >
            Logout Now
          </button>
        </div>
      </div>
    </div>
  );
} 