/**
 * 🚀 ULTRA-FAST PRODUCT LOADER - Amazon-Level Performance
 * 
 * This component implements Amazon's product loading strategy:
 * 1. Skeleton loading states for instant perceived performance
 * 2. Progressive loading with background refresh
 * 3. Smart caching with invalidation
 * 4. Error boundaries with graceful fallbacks
 * 5. Performance monitoring and optimization
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import ultraFastApiService from '../services/ultraFastApiService.js';

// =====================================================================================
// 🎨 SKELETON LOADING COMPONENTS
// =====================================================================================

const ProductSkeleton = ({ count = 6 }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden animate-pulse">
                    {/* Image skeleton */}
                    <div className="aspect-square bg-gray-200 relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer"></div>
                    </div>
                    
                    {/* Content skeleton */}
                    <div className="p-4 space-y-3">
                        {/* Title skeleton */}
                        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                        
                        {/* Price skeleton */}
                        <div className="h-5 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                        
                        {/* Category skeleton */}
                        <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const ProductCardSkeleton = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden animate-pulse">
        <div className="aspect-square bg-gray-200 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer"></div>
        </div>
        <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            <div className="h-5 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        </div>
    </div>
);

// =====================================================================================
// 🚀 ULTRA-FAST PRODUCT LOADER COMPONENT
// =====================================================================================

const UltraFastProductLoader = ({ 
    children, 
    categorySlug = 'all',
    searchQuery = '',
    limit = 20,
    priority = 'speed',
    onProductsLoaded,
    onError,
    showSkeleton = true,
    skeletonCount = 6
}) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [performance, setPerformance] = useState(null);
    const [cacheStatus, setCacheStatus] = useState('MISS');

    // Memoized options to prevent unnecessary re-renders
    const options = useMemo(() => ({
        categorySlug,
        search: searchQuery,
        limit,
        priority
    }), [categorySlug, searchQuery, limit, priority]);

    // Ultra-fast product loading with smart caching
    const loadProducts = useCallback(async (retryCount = 0) => {
        try {
            setLoading(true);
            setError(null);
            
            const startTime = performance.now();
            console.log('🚀 Ultra-fast loading products...', options);
            
            let response;
            
            // Choose the best loading strategy based on options
            if (searchQuery && searchQuery.length >= 2) {
                response = await ultraFastApiService.searchProductsInstant(searchQuery, limit);
            } else if (categorySlug !== 'all') {
                response = await ultraFastApiService.preloadProducts(categorySlug, limit);
            } else if (priority === 'speed') {
                response = await ultraFastApiService.getProductsUltraFast();
            } else {
                response = await ultraFastApiService.getProductsSmart(options);
            }
            
            const loadTime = performance.now() - startTime;
            console.log(`⚡ Products loaded in ${loadTime.toFixed(2)}ms`);
            
            // Update performance metrics
            setPerformance({
                loadTime: Math.round(loadTime),
                cacheStatus: response.cacheStatus || 'MISS',
                responseTime: response.responseTime,
                total: response.total || response.products?.length || 0
            });
            
            setCacheStatus(response.cacheStatus || 'MISS');
            
            // Process products
            const productList = response.products || response.data || [];
            setProducts(productList);
            
            // Notify parent component
            if (onProductsLoaded) {
                onProductsLoaded(productList, {
                    loadTime: Math.round(loadTime),
                    cacheStatus: response.cacheStatus,
                    total: productList.length
                });
            }
            
        } catch (err) {
            console.error('❌ Ultra-fast loading error:', err);
            setError(err);
            
            if (onError) {
                onError(err);
            }
            
            // Show user-friendly error message
            const errorMessage = err.message || 'Failed to load products. Please try again.';
            toast.error(errorMessage);
            
            // Retry logic for network errors
            if (retryCount < 2 && (
                err.type === 'NETWORK_ERROR' || 
                err.type === 'API_ERROR' && err.status >= 500
            )) {
                const delay = Math.pow(2, retryCount) * 1000;
                console.log(`🔄 Retrying in ${delay}ms... (attempt ${retryCount + 1})`);
                
                setTimeout(() => {
                    loadProducts(retryCount + 1);
                }, delay);
                return;
            }
        } finally {
            setLoading(false);
        }
    }, [options, onProductsLoaded, onError]);

    // Load products on mount and when options change
    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    // Background refresh for cache warming
    useEffect(() => {
        const refreshInterval = setInterval(async () => {
            try {
                // Silently refresh cache in background
                await ultraFastApiService.getProductsSmart(options);
                console.log('🔄 Background cache refresh completed');
            } catch (error) {
                console.error('Background refresh failed:', error);
            }
        }, 30000); // Refresh every 30 seconds

        return () => clearInterval(refreshInterval);
    }, [options]);

    // Warm cache on component mount
    useEffect(() => {
        const warmCache = async () => {
            try {
                await ultraFastApiService.warmCache();
                console.log('🔥 Cache warmed successfully');
            } catch (error) {
                console.error('Cache warming failed:', error);
            }
        };

        warmCache();
    }, []);

    // Render loading skeleton
    if (loading && showSkeleton) {
        return (
            <div className="space-y-4">
                <ProductSkeleton count={skeletonCount} />
                {performance && (
                    <div className="text-sm text-gray-500 text-center">
                        Loading... {performance.loadTime}ms
                    </div>
                )}
            </div>
        );
    }

    // Render error state
    if (error && !loading) {
        return (
            <div className="text-center py-8">
                <div className="text-red-500 mb-4">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Products</h3>
                <p className="text-gray-500 mb-4">{error.message}</p>
                <button
                    onClick={() => loadProducts()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    // Render children with products
    return (
        <div className="space-y-4">
            {children && children(products, { loading, error, performance, cacheStatus })}
            
            {/* Performance indicator (development only) */}
            {process.env.NODE_ENV === 'development' && performance && (
                <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded-lg">
                    <div>Load Time: {performance.loadTime}ms</div>
                    <div>Cache: {cacheStatus}</div>
                    <div>Products: {performance.total}</div>
                </div>
            )}
        </div>
    );
};

// =====================================================================================
// 🎯 SMART PRODUCT GRID COMPONENT
// =====================================================================================

const UltraFastProductGrid = ({ 
    categorySlug = 'all',
    searchQuery = '',
    limit = 20,
    priority = 'speed',
    onProductClick,
    ProductCardComponent
}) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [performance, setPerformance] = useState(null);

    const handleProductsLoaded = useCallback((loadedProducts, metrics) => {
        setProducts(loadedProducts);
        setPerformance(metrics);
        setLoading(false);
    }, []);

    const handleError = useCallback((error) => {
        console.error('Product grid error:', error);
        setLoading(false);
    }, []);

    return (
        <UltraFastProductLoader
            categorySlug={categorySlug}
            searchQuery={searchQuery}
            limit={limit}
            priority={priority}
            onProductsLoaded={handleProductsLoaded}
            onError={handleError}
            showSkeleton={true}
            skeletonCount={limit}
        >
            {(loadedProducts, { loading: isLoading, error, performance: perf, cacheStatus }) => (
                <div className="space-y-4">
                    {/* Performance indicator */}
                    {perf && (
                        <div className="text-sm text-gray-500 text-center">
                            {isLoading ? 'Loading...' : `Loaded ${loadedProducts.length} products in ${perf.loadTime}ms`}
                            {cacheStatus && ` (${cacheStatus})`}
                        </div>
                    )}
                    
                    {/* Product grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {loadedProducts.map((product) => (
                            <div key={product._id || product.customId}>
                                {ProductCardComponent ? (
                                    <ProductCardComponent 
                                        product={product} 
                                        onClick={() => onProductClick?.(product)}
                                    />
                                ) : (
                                    <div 
                                        className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                                        onClick={() => onProductClick?.(product)}
                                    >
                                        <div className="aspect-square bg-gray-100 relative">
                                            {product.image ? (
                                                <img 
                                                    src={product.image} 
                                                    alt={product.name}
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                    <span className="text-gray-400">No Image</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                                            <p className="text-lg font-bold text-blue-600">₹{product.price}</p>
                                            {product.category && (
                                                <p className="text-sm text-gray-500">{product.category}</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    
                    {/* Empty state */}
                    {!isLoading && loadedProducts.length === 0 && (
                        <div className="text-center py-8">
                            <div className="text-gray-400 mb-4">
                                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Found</h3>
                            <p className="text-gray-500">Try adjusting your search or filters</p>
                        </div>
                    )}
                </div>
            )}
        </UltraFastProductLoader>
    );
};

// =====================================================================================
// 🔍 INSTANT SEARCH COMPONENT
// =====================================================================================

const UltraFastSearch = ({ 
    onSearchResults,
    placeholder = "Search products...",
    debounceMs = 300
}) => {
    const [query, setQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState([]);

    // Debounced search
    useEffect(() => {
        if (!query || query.length < 2) {
            setResults([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            try {
                setSearching(true);
                const response = await ultraFastApiService.searchProductsInstant(query, 10);
                setResults(response.products || []);
                
                if (onSearchResults) {
                    onSearchResults(response.products || []);
                }
            } catch (error) {
                console.error('Search error:', error);
                setResults([]);
            } finally {
                setSearching(false);
            }
        }, debounceMs);

        return () => clearTimeout(timeoutId);
    }, [query, debounceMs, onSearchResults]);

    return (
        <div className="relative">
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            {searching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                </div>
            )}
            
            {query && query.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                    {results.length > 0 ? (
                        results.map((product) => (
                            <div key={product._id} className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0">
                                <div className="flex items-center space-x-3">
                                    {product.image && (
                                        <img 
                                            src={product.image} 
                                            alt={product.name}
                                            className="w-10 h-10 object-cover rounded"
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                                        <p className="text-sm text-gray-500">₹{product.price}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : !searching && (
                        <div className="p-3 text-sm text-gray-500">No results found</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default UltraFastProductLoader;
export { UltraFastProductGrid, UltraFastSearch, ProductSkeleton, ProductCardSkeleton };
