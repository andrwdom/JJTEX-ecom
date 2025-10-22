import { useState, useEffect } from 'react';

/**
 * Custom hook to monitor network status
 * Provides online/offline state and connection quality indicators
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionQuality, setConnectionQuality] = useState('unknown');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('🌐 Network: Online');
    };

    const handleOffline = () => {
      setIsOnline(false);
      setConnectionQuality('offline');
      console.log('🌐 Network: Offline');
    };

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection quality if available
    if ('connection' in navigator) {
      const connection = navigator.connection;
      
      const updateConnectionQuality = () => {
        if (connection.effectiveType) {
          setConnectionQuality(connection.effectiveType);
          console.log('🌐 Connection quality:', connection.effectiveType);
        }
      };

      updateConnectionQuality();
      connection.addEventListener('change', updateConnectionQuality);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        connection.removeEventListener('change', updateConnectionQuality);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    connectionQuality,
    isSlowConnection: connectionQuality === 'slow-2g' || connectionQuality === '2g',
    isFastConnection: connectionQuality === '4g'
  };
};

export default useNetworkStatus;
