/**
 * 📊 PERFORMANCE MONITOR - Real-time Performance Tracking
 * 
 * This component monitors and displays performance metrics:
 * 1. API response times and cache hit rates
 * 2. Memory usage and optimization suggestions
 * 3. Network performance and error tracking
 * 4. User experience metrics
 * 5. Performance alerts and recommendations
 */

import React, { useState, useEffect, useCallback } from 'react';
import ultraFastApiService from '../services/ultraFastApiService.js';

const PerformanceMonitor = ({ 
    showDetails = false, 
    position = 'bottom-right',
    autoRefresh = true,
    refreshInterval = 5000
}) => {
    const [metrics, setMetrics] = useState({
        apiResponseTime: 0,
        cacheHitRate: 0,
        memoryUsage: null,
        networkStatus: 'online',
        errorCount: 0,
        lastUpdate: null
    });
    
    const [isVisible, setIsVisible] = useState(showDetails);
    const [alerts, setAlerts] = useState([]);

    // Performance monitoring
    const updateMetrics = useCallback(async () => {
        try {
            // Get cache statistics
            const cacheStats = ultraFastApiService.getCacheStats();
            
            // Get memory usage
            const memoryUsage = ultraFastApiService.getMemoryUsage();
            
            // Get performance stats from backend
            const backendStats = await ultraFastApiService.getPerformanceStats();
            
            // Calculate cache hit rate
            const cacheHitRate = cacheStats?.hitRate || 0;
            
            // Check for performance issues
            const newAlerts = [];
            
            if (metrics.apiResponseTime > 500) {
                newAlerts.push({
                    type: 'warning',
                    message: 'API response time is slow (>500ms)',
                    timestamp: new Date()
                });
            }
            
            if (cacheHitRate < 0.7) {
                newAlerts.push({
                    type: 'info',
                    message: 'Cache hit rate is low (<70%)',
                    timestamp: new Date()
                });
            }
            
            if (memoryUsage && memoryUsage.used > memoryUsage.limit * 0.8) {
                newAlerts.push({
                    type: 'error',
                    message: 'Memory usage is high (>80%)',
                    timestamp: new Date()
                });
            }
            
            setMetrics({
                apiResponseTime: backendStats?.performance?.responseTime || 0,
                cacheHitRate: cacheHitRate,
                memoryUsage,
                networkStatus: navigator.onLine ? 'online' : 'offline',
                errorCount: metrics.errorCount,
                lastUpdate: new Date()
            });
            
            setAlerts(prev => [...newAlerts, ...prev].slice(0, 10)); // Keep last 10 alerts
            
        } catch (error) {
            console.error('Performance monitoring error:', error);
            setMetrics(prev => ({
                ...prev,
                errorCount: prev.errorCount + 1,
                lastUpdate: new Date()
            }));
        }
    }, [metrics.apiResponseTime, metrics.errorCount]);

    // Auto-refresh metrics
    useEffect(() => {
        if (!autoRefresh) return;
        
        const interval = setInterval(updateMetrics, refreshInterval);
        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval, updateMetrics]);

    // Initial metrics load
    useEffect(() => {
        updateMetrics();
    }, [updateMetrics]);

    // Network status monitoring
    useEffect(() => {
        const handleOnline = () => setMetrics(prev => ({ ...prev, networkStatus: 'online' }));
        const handleOffline = () => setMetrics(prev => ({ ...prev, networkStatus: 'offline' }));
        
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const getPerformanceColor = (value, thresholds) => {
        if (value <= thresholds.good) return 'text-green-500';
        if (value <= thresholds.warning) return 'text-yellow-500';
        return 'text-red-500';
    };

    const getAlertIcon = (type) => {
        switch (type) {
            case 'error': return '❌';
            case 'warning': return '⚠️';
            case 'info': return 'ℹ️';
            default: return '📊';
        }
    };

    const positionClasses = {
        'top-left': 'top-4 left-4',
        'top-right': 'top-4 right-4',
        'bottom-left': 'bottom-4 left-4',
        'bottom-right': 'bottom-4 right-4'
    };

    if (!isVisible && !showDetails) {
        return (
            <button
                onClick={() => setIsVisible(true)}
                className={`fixed ${positionClasses[position]} bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded cursor-pointer hover:bg-opacity-90 transition-all`}
            >
                📊 {metrics.apiResponseTime}ms
            </button>
        );
    }

    return (
        <div className={`fixed ${positionClasses[position]} bg-black bg-opacity-90 text-white text-xs p-3 rounded-lg max-w-sm z-50`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-sm">Performance Monitor</h3>
                <button
                    onClick={() => setIsVisible(false)}
                    className="text-gray-400 hover:text-white"
                >
                    ✕
                </button>
            </div>

            {/* Metrics */}
            <div className="space-y-2">
                {/* API Response Time */}
                <div className="flex justify-between">
                    <span>API Response:</span>
                    <span className={getPerformanceColor(metrics.apiResponseTime, { good: 100, warning: 300 })}>
                        {metrics.apiResponseTime}ms
                    </span>
                </div>

                {/* Cache Hit Rate */}
                <div className="flex justify-between">
                    <span>Cache Hit Rate:</span>
                    <span className={getPerformanceColor(metrics.cacheHitRate * 100, { good: 80, warning: 60 })}>
                        {Math.round(metrics.cacheHitRate * 100)}%
                    </span>
                </div>

                {/* Memory Usage */}
                {metrics.memoryUsage && (
                    <div className="flex justify-between">
                        <span>Memory:</span>
                        <span className={getPerformanceColor(
                            (metrics.memoryUsage.used / metrics.memoryUsage.limit) * 100,
                            { good: 60, warning: 80 }
                        )}>
                            {Math.round(metrics.memoryUsage.used)}MB / {Math.round(metrics.memoryUsage.limit)}MB
                        </span>
                    </div>
                )}

                {/* Network Status */}
                <div className="flex justify-between">
                    <span>Network:</span>
                    <span className={metrics.networkStatus === 'online' ? 'text-green-500' : 'text-red-500'}>
                        {metrics.networkStatus === 'online' ? '🟢' : '🔴'} {metrics.networkStatus}
                    </span>
                </div>

                {/* Error Count */}
                {metrics.errorCount > 0 && (
                    <div className="flex justify-between">
                        <span>Errors:</span>
                        <span className="text-red-500">{metrics.errorCount}</span>
                    </div>
                )}

                {/* Last Update */}
                {metrics.lastUpdate && (
                    <div className="text-gray-400 text-xs">
                        Updated: {metrics.lastUpdate.toLocaleTimeString()}
                    </div>
                )}
            </div>

            {/* Alerts */}
            {alerts.length > 0 && (
                <div className="mt-3 border-t border-gray-600 pt-2">
                    <h4 className="font-semibold mb-1">Alerts:</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                        {alerts.slice(0, 5).map((alert, index) => (
                            <div key={index} className="text-xs flex items-start space-x-1">
                                <span>{getAlertIcon(alert.type)}</span>
                                <span className="flex-1">{alert.message}</span>
                                <span className="text-gray-400">
                                    {alert.timestamp.toLocaleTimeString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="mt-3 border-t border-gray-600 pt-2 flex space-x-2">
                <button
                    onClick={updateMetrics}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                >
                    Refresh
                </button>
                <button
                    onClick={() => ultraFastApiService.clearCache()}
                    className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
                >
                    Clear Cache
                </button>
            </div>
        </div>
    );
};

export default PerformanceMonitor;
