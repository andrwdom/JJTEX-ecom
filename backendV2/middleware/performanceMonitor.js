import { performance } from 'perf_hooks';

/**
 * Performance Monitoring Middleware
 * Tracks API response times and performance metrics
 */

export const performanceMonitor = (req, res, next) => {
    const startTime = performance.now();
    const startMemory = process.memoryUsage();
    
    // Override res.json to capture response time
    const originalJson = res.json;
    res.json = function(data) {
        const endTime = performance.now();
        const endMemory = process.memoryUsage();
        
        const responseTime = Math.round(endTime - startTime);
        const memoryUsed = Math.round((endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024); // MB
        
        // Add performance headers
        res.set({
            'X-Response-Time': `${responseTime}ms`,
            'X-Memory-Used': `${memoryUsed}MB`,
            'X-Performance-Score': getPerformanceScore(responseTime, memoryUsed)
        });
        
        // Log slow requests
        if (responseTime > 1000) { // Slower than 1 second
            console.warn(`🐌 Slow request: ${req.method} ${req.path} - ${responseTime}ms`);
        } else if (responseTime > 500) { // Slower than 500ms
            console.log(`⚠️ Moderate request: ${req.method} ${req.path} - ${responseTime}ms`);
        } else {
            console.log(`⚡ Fast request: ${req.method} ${req.path} - ${responseTime}ms`);
        }
        
        return originalJson.call(this, data);
    };
    
    next();
};

function getPerformanceScore(responseTime, memoryUsed) {
    // Performance scoring: 0-100 (100 = best)
    let score = 100;
    
    // Response time scoring
    if (responseTime > 2000) score -= 40; // Very slow
    else if (responseTime > 1000) score -= 25; // Slow
    else if (responseTime > 500) score -= 10; // Moderate
    else if (responseTime < 100) score += 10; // Very fast
    
    // Memory usage scoring
    if (memoryUsed > 50) score -= 20; // High memory usage
    else if (memoryUsed > 20) score -= 10; // Moderate memory usage
    else if (memoryUsed < 5) score += 5; // Low memory usage
    
    return Math.max(0, Math.min(100, score));
}

export default performanceMonitor;




