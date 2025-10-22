import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { toast } from 'react-toastify';

const NetworkStatusIndicator = () => {
  const { isOnline, connectionQuality, isSlowConnection } = useNetworkStatus();
  const [showIndicator, setShowIndicator] = useState(false);
  const [lastOnlineStatus, setLastOnlineStatus] = useState(true);

  useEffect(() => {
    // Show indicator when network status changes
    if (isOnline !== lastOnlineStatus) {
      setShowIndicator(true);
      setLastOnlineStatus(isOnline);
      
      if (!isOnline) {
        toast.error('You are offline. Some features may not work properly.');
      } else {
        toast.success('Connection restored!');
      }
    }

    // Hide indicator after 3 seconds
    if (showIndicator) {
      const timer = setTimeout(() => {
        setShowIndicator(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, lastOnlineStatus, showIndicator]);

  // Don't show anything if online and good connection
  if (isOnline && !isSlowConnection && !showIndicator) {
    return null;
  }

  return (
    <AnimatePresence>
      {(showIndicator || !isOnline || isSlowConnection) && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-white shadow-lg border-b"
        >
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-center gap-3">
              {/* Network Icon */}
              <div className="flex items-center gap-2">
                {!isOnline ? (
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                ) : isSlowConnection ? (
                  <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
                ) : (
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                )}
                
                <span className="text-sm font-medium">
                  {!isOnline ? 'Offline' : 
                   isSlowConnection ? 'Slow Connection' : 
                   'Online'}
                </span>
              </div>

              {/* Connection Quality Indicator */}
              {isOnline && (
                <div className="text-xs text-gray-500">
                  {connectionQuality !== 'unknown' && `(${connectionQuality})`}
                </div>
              )}

              {/* Retry Button for Offline */}
              {!isOnline && (
                <button
                  onClick={() => window.location.reload()}
                  className="ml-2 px-3 py-1 bg-blue-500 text-white text-xs rounded-full hover:bg-blue-600 transition-colors"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NetworkStatusIndicator;
