import express from 'express'
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync } from 'fs';
import dotenv from 'dotenv';

// Load .env file from the correct path FIRST
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '.env');

console.log('🔧 Loading .env from:', envPath);
console.log('🔧 .env file exists:', existsSync(envPath));

// Load environment variables
dotenv.config({ path: envPath });

// Initialize Sentry for error monitoring (non-intrusive)
let Sentry = null;

// Import new production-grade systems
import { expressErrorHandler } from './utils/errorHandler.js';
import { startPeriodicMonitoring } from './utils/monitoringSystem.js';

// 🔧 JJTEX: Make Sentry optional - only import if installed
let SentryNode = null;
try {
  const sentryModule = await import('@sentry/node');
  SentryNode = sentryModule;
  console.log('✅ Sentry monitoring enabled');
} catch (error) {
  console.log('⚠️  Sentry not installed - monitoring disabled (optional)');
}

// Now import config (which also loads dotenv but won't conflict)
import { config } from './config.js'
import cors from 'cors';
import { trackRequest, trackMemoryUsage, getHealthStatus } from './utils/monitoring.js';
import rateLimit from 'express-rate-limit'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import connectDB from './config/mongodb.js'
import mongoose from 'mongoose'
import userRouter from './routes/userRoute.js'
import productRouter from './routes/productRoute.js'
import ultraFastRoutes from './routes/ultraFastRoutes.js'
import cartRouter from './routes/cartRoute.js'
import orderRouter from './routes/orderRoute.js'
import paymentRouter from './routes/paymentRoute.js'
import checkoutRouter from './routes/checkoutRoute.js'
import couponRouter from './routes/couponRoutes.js'
import carouselRouter from './routes/carouselRoutes.js'
import categoryRouter from './routes/categoryRoute.js'
import contactRouter from './routes/contactRoute.js'
import wishlistRouter from './routes/wishlistRoutes.js'
import shippingRouter from './routes/shippingRoute.js'
import shippingRulesRouter from './routes/shippingRulesRoute.js'
import heroImagesRouter from './routes/heroImagesRoute.js'
import reservationRouter from './routes/reservationRoute.js'
import adminRouter from './routes/adminRoute.js'
import stockRouter from './routes/stockRoutes.js'
import cachedRoutes from './routes/cachedRoutes.js'
import monitoringRouter from './routes/monitoring.js'
import maintenanceRouter from './routes/maintenance.js'
import webhookManagementRouter from './routes/webhookManagement.js'
import atomicPaymentRouter from './routes/atomicPaymentRoute.js'
import systemMonitoringRouter from './routes/monitoringRoute.js'
import legacyRouter from './routes/legacyRoutes.js'
// Removed bulletproofWebhookRouter - using enhancedWebhookController instead
import { maintenanceMode } from './middleware/maintenanceMode.js'
import { startReconciliationCron } from './utils/reconciliation.js'
import { requestLogger, quickRequestLogger, fileRequestLogger } from './middleware/requestLogger.js'
import Logger from './utils/logger.js'
import redisService from './services/redisService.js'
import admin from 'firebase-admin'
import orderModel from './models/orderModel.js'
import Category from './models/Category.js'
import productModel from './models/productModel.js'
import { randomBytes } from 'crypto'

// App Config
const app = express()
const PORT = config.port

// ✅ INITIALIZE FIREBASE ADMIN SDK - CRITICAL FOR AUTHENTICATION
try {
  // Check if Firebase is already initialized to avoid duplicate initialization errors
  if (!admin.apps.length) {
    // Get the directory path (already imported at top of file)
    const __dirname = dirname(fileURLToPath(import.meta.url));
    
    // Try to load from the root directory first (production deployment)
    let serviceAccountPath = join(__dirname, '../jjtextiles-ecom-firebase-adminsdk-fbsvc-4e8db84e32.json');
    
    // If not found in root, try in backendV2 directory
    if (!existsSync(serviceAccountPath)) {
      serviceAccountPath = join(__dirname, 'jjtextiles-ecom-firebase-adminsdk-fbsvc-4e8db84e32.json');
    }
    
    // If still not found, check for env variable
    if (!existsSync(serviceAccountPath) && process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: 'jjtextiles-ecom'
        });
        console.log('✅ Firebase Admin SDK initialized from environment variable');
      } catch (error) {
        console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', error.message);
      }
    } else if (existsSync(serviceAccountPath)) {
      // Initialize with file path
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'jjtextiles-ecom'
      });
      console.log('✅ Firebase Admin SDK initialized successfully from:', serviceAccountPath);
    } else {
      console.warn('⚠️  Firebase credentials file not found. Firebase authentication will not work.');
      console.warn('   Expected file: jjtextiles-ecom-firebase-adminsdk-fbsvc-4e8db84e32.json');
      console.warn('   Please ensure the credentials file is in the project root or set FIREBASE_SERVICE_ACCOUNT_KEY env variable');
    }
  } else {
    console.log('✅ Firebase Admin SDK already initialized');
  }
} catch (error) {
  console.error('❌ Error initializing Firebase Admin SDK:', error);
  console.error('   This is required for user authentication to work');
}

// Environment variables validation (no secrets logged)
if (process.env.NODE_ENV === 'development') {
  Logger.info('environment_debug', {
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    mongodbConfigured: !!process.env.MONGODB_URI,
    jwtConfigured: !!process.env.JWT_SECRET,
    phonepeConfigured: !!process.env.PHONEPE_MERCHANT_ID,
    phonepeApiConfigured: !!process.env.PHONEPE_API_KEY,
    firebaseInitialized: admin.apps.length > 0
  });
}

// Log server startup
Logger.info('server_starting', {
  port: PORT,
  nodeEnv: process.env.NODE_ENV,
  firebaseInitialized: admin.apps.length > 0,
  timestamp: new Date().toISOString()
})

// Trust proxy - required for rate limiting behind reverse proxy
app.set('trust proxy', 1)

// SECURITY: Configure CORS for Production
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      // Admin panel
      // JJTEX domains
      'https://jjtextiles.com',
      'https://www.jjtextiles.com',
      'https://admin.jjtextiles.com',
      'https://api.jjtextiles.com',
      // Instagram in-app browser specific origins
      'https://www.instagram.com',
      'https://instagram.com',
      'https://m.instagram.com',
      'https://www.facebook.com',
      'https://facebook.com',
      'https://m.facebook.com'
    ]
  : [
      'http://localhost:3000',     // Frontend dev
      'http://localhost:5173',     // Admin dev
      'http://localhost:5174',     // Additional dev port
      'http://localhost:4173',     // Admin production preview
      'http://localhost:3001'      // Additional dev port
    ];

const corsOptions = {
    origin: (origin, callback) => {
        // Security: Log CORS attempts without exposing sensitive data
        Logger.debug('cors_check', {
            origin: origin ? 'provided' : 'none',
            timestamp: new Date().toISOString()
        });
        
        // Allow requests with no origin (like mobile apps, curl requests, or server-to-server)
        // Also allow all origins in development
        if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            Logger.debug('cors_allowed', { origin: origin ? 'provided' : 'none' });
            callback(null, true);
        } else {
            // Special handling for Instagram in-app browser
            // Instagram in-app browser sometimes sends different origin headers
            if (origin && (
                origin.includes('instagram.com') || 
                origin.includes('facebook.com') ||
                origin.includes('fbcdn.net') ||
                origin.includes('cdninstagram.com')
            )) {
                Logger.debug('cors_allowed_instagram', { origin });
                callback(null, true);
            } else {
                Logger.warn('cors_blocked', { 
                    origin: origin ? 'provided' : 'none',
                    allowedOriginsCount: allowedOrigins.length
                });
                callback(new Error('Not allowed by CORS'));
            }
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'token', 'x-requested-with', 'Accept', 'Origin', 'x-request-id', 'X-Request-ID', 'Cache-Control', 'Pragma'],
    exposedHeaders: ['Access-Control-Allow-Origin', 'Access-Control-Allow-Credentials'],
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204
};

// CRITICAL: Handle CORS and preflight requests BEFORE any other middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// CRITICAL: Mount raw webhook route BEFORE body parsers to capture raw payload
import rawWebhookRouter from './routes/rawWebhook.js';
app.use(rawWebhookRouter);

// Webhook handling is done via payment routes at /api/payment/phonepe/webhook

// Initialize Sentry properly (only if available)
if (SentryNode && process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  SentryNode.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'production'
  });
  Sentry = SentryNode;
  app.use(Sentry.requestHandler());
}

// Connect to MongoDB
connectDB().then(async () => {
  Logger.info('mongodb_connected', { timestamp: Date.now() });
  
  // Auto-seed default categories if none exist - JJTEX CATEGORIES
  const count = await Category.countDocuments();
  if (count === 0) {
    await Category.create([
      // Kids Categories
      { name: 'Kids', slug: 'kids', description: 'Kids clothing collection' },
      { name: 'Boys Clothing', slug: 'boys-clothing', description: 'Boys clothing and accessories' },
      { name: 'Girls Clothing', slug: 'girls-clothing', description: 'Girls clothing and accessories' },
      { name: 'Baby Clothing', slug: 'baby-clothing', description: 'Baby clothing and essentials' },
      { name: 'Teens Clothing', slug: 'teens-clothing', description: 'Teenage fashion and clothing' },
      
      // Women Categories
      { name: 'Women', slug: 'women', description: 'Women fashion collection' },
      { name: 'Ethnic Wear', slug: 'ethnic-wear', description: 'Traditional ethnic wear for women' },
      { name: 'Western Wear', slug: 'western-wear', description: 'Western style clothing for women' },
      { name: 'Jewellery', slug: 'jewellery', description: 'Fashion jewellery and accessories' }
    ]);
    Logger.info('categories_seeded', { count: 9, store: 'JJTEX' });
  }
  else {
    Logger.info('categories_exist', { count });
  }
}).catch(err => {
  Logger.error('mongodb_connection_failed', err, {
    timestamp: Date.now(),
    critical: true
  });
  console.error('MongoDB connection error:', err);
});

// Debug logging middleware
// Logging middleware - PRODUCTION OPTIMIZED
app.use((req, res, next) => {
    // Only log in development or for errors in production
    if (process.env.NODE_ENV === 'development') {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    }
    
    // Add request ID for tracking
    req.headers['x-request-id'] = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Log slow requests in production
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        if (duration > 1000) { // Log requests taking more than 1 second
            console.warn(`🐌 SLOW REQUEST: ${req.method} ${req.url} took ${duration}ms - ${req.ip}`);
        }
    });
    
    next();
});

// Rate limiting - PRODUCTION OPTIMIZED FOR E-COMMERCE
// Different rate limits for different types of requests

// Very lenient rate limiting for product browsing (most common requests)
const browseLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 2000, // 2000 requests per 15 minutes for browsing
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for local dev and OPTIONS requests
        return (
            req.headers.origin === 'http://localhost:5174' ||
            req.headers.origin === 'http://localhost:5173' ||
            req.headers.origin === 'http://localhost:3000' ||
            req.headers.origin === 'http://localhost:3001' ||
            req.method === 'OPTIONS'
        );
    }
});

// General API rate limiting (moderate for cart operations)
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // 500 requests per 15 minutes for general API calls
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for local dev and OPTIONS requests
        return (
            req.headers.origin === 'http://localhost:5174' ||
            req.headers.origin === 'http://localhost:5173' ||
            req.headers.origin === 'http://localhost:3000' ||
            req.headers.origin === 'http://localhost:3001' ||
            req.method === 'OPTIONS'
        );
    }
});

// Stricter rate limiting for sensitive operations (auth, payments, etc.)
const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes for sensitive operations
    message: 'Too many requests for this operation, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for local dev and OPTIONS requests
        return (
            req.headers.origin === 'http://localhost:5174' ||
            req.headers.origin === 'http://localhost:5173' ||
            req.headers.origin === 'http://localhost:3000' ||
            req.headers.origin === 'http://localhost:3001' ||
            req.method === 'OPTIONS'
        );
    }
});

// Apply general rate limiting to all routes
app.use(generalLimiter);

// SECURITY: Helmet for comprehensive security headers
app.use(helmet({
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            "default-src": ["'self'"],
            "img-src": ["'self'", "data:", "blob:", "https:", "http:"],
            "script-src": ["'self'"],
            "style-src": ["'self'", "'unsafe-inline'"],
            "connect-src": ["'self'", "https://shithaa.in", "https://admin.shithaa.in", "https://shitha-frontend.vercel.app", "https://admin.shithaa.com", "https://shithaa.com", "https://api.jjtextiles.com", "https://jjtextiles.com", "https://admin.jjtextiles.com", "http://localhost:5173", "http://localhost:5174", "http://localhost:3000", "http://localhost:3001"],
            "frame-ancestors": ["'none'"],
        },
    }
}));

// SECURITY: Cookie parser for HttpOnly cookies
app.use(cookieParser());

// middlewares
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// MAINTENANCE MODE MIDDLEWARE - Apply before other routes
app.use(maintenanceMode)

// ENHANCED REQUEST LOGGING - Log all critical endpoints
app.use(requestLogger)

// PRODUCTION MONITORING: Request tracking middleware
app.use((req, res, next) => {
    const startTime = Date.now();
    
    // Track memory usage
    trackMemoryUsage();
    
    // Override res.end to track response time
    const originalEnd = res.end;
    res.end = function(...args) {
        const responseTime = Date.now() - startTime;
        const isError = res.statusCode >= 400;
        
        // Track request metrics
        trackRequest(responseTime, isError);
        
        // Call original end
        originalEnd.apply(this, args);
    };
    
    next();
});

// Performance optimization middleware
app.use((req, res, next) => {
    // Add performance headers for API responses
    if (req.path.startsWith('/api/')) {
        // 🔥 CRITICAL: Zero cache + version tracking for instant updates
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-API-Version': process.env.API_VERSION || '1.0.0',
            'X-Build-Time': process.env.BUILD_TIME || new Date().toISOString()
        });
    }
    next();
});

// 🔧 JJTEX: Static file serving with caching headers for better performance
// Serve product images from local VPS storage
const uploadsPath = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsPath, {
    maxAge: '1d', // Cache for 1 day
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
        // Add comprehensive CORS headers for images
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        res.setHeader('Access-Control-Allow-Credentials', 'false');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    }
}))
// Legacy routes for backward compatibility
app.use('/images', express.static(uploadsPath, {
    maxAge: '1d', // Cache for 1 day
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
        // Add comprehensive CORS headers for images
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        res.setHeader('Access-Control-Allow-Credentials', 'false');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    }
}));
app.use('/gallery', express.static(uploadsPath, {
    maxAge: '1d', // Cache for 1 day
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
        // Add CORS headers for images
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
}));

// api endpoints
// Apply strict rate limiting to sensitive routes
app.use('/api/user', strictLimiter, userRouter)
app.use('/api/payment', strictLimiter, paymentRouter)
app.use('/api/checkout', strictLimiter, checkoutRouter)
app.use('/api/orders', strictLimiter, orderRouter)

// NEW: Atomic payment system (production-ready)
app.use('/api/atomic-payment', strictLimiter, atomicPaymentRouter)

// Apply browse rate limiting to product browsing (most common requests)
app.use('/api/products', browseLimiter, productRouter)
app.use('/api/products', ultraFastRoutes)
app.use('/api/categories', browseLimiter, categoryRouter)
app.use('/api/carousel', browseLimiter, carouselRouter)
app.use('/api/hero-images', browseLimiter, heroImagesRouter)

// Apply general rate limiting to other routes
app.use('/api/cart', cartRouter)
app.use('/api/coupons', couponRouter)
app.use('/api/contact', contactRouter)
app.use('/api/wishlist', wishlistRouter)
app.use('/api/shipping', shippingRouter)
app.use('/api/shipping-rules', shippingRulesRouter)
app.use('/api/reservations', reservationRouter)
app.use('/api/admin', adminRouter)
app.use('/api/stock', stockRouter)

// Cached routes (high performance)
app.use('/api/cached', cachedRoutes)

// Monitoring routes (admin access)
app.use('/api/monitoring', monitoringRouter)

// NEW: System monitoring and health checks
app.use('/api/system-monitoring', systemMonitoringRouter)

// Maintenance routes (admin access)
app.use('/api/maintenance', maintenanceRouter)

// Webhook management routes (admin access)
app.use('/api/webhook-management', webhookManagementRouter)

// Webhook monitoring and admin routes
import webhookMonitoringRouter from './routes/webhookMonitoring.js'
app.use('/api/webhook-monitoring', webhookMonitoringRouter)

// Legacy routes for backward compatibility with existing frontend
app.use(legacyRouter)

// Legacy routes for backward compatibility
app.use('/api/product', productRouter)

// Public orders debug route (before any middleware)
app.get('/api/orders/public-list', async (req, res) => {
  try {
    const orders = await orderModel.find().sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, message: 'Error fetching orders' });
  }
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  console.log('CORS test endpoint hit');
  console.log('Origin:', req.headers.origin);
  console.log('Referer:', req.headers.referer);
  res.json({ 
    success: true, 
    message: 'CORS test successful',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// Cache management endpoints
app.get('/api/cache/stats', async (req, res) => {
  try {
    const stats = await redisService.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Cache stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cache stats'
    });
  }
});

app.post('/api/cache/clear', async (req, res) => {
  try {
    const { pattern } = req.body;
    
    if (pattern) {
      const deleted = await redisService.delPattern(pattern);
      res.json({
        success: true,
        message: `Cleared ${deleted} keys matching pattern: ${pattern}`
      });
    } else {
      // Clear all caches
      await redisService.delPattern('*');
      res.json({
        success: true,
        message: 'All caches cleared'
      });
    }
  } catch (error) {
    console.error('Cache clear error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache'
    });
  }
});

app.get('/api/cache/keys', async (req, res) => {
  try {
    const { pattern = '*' } = req.query;
    const keys = await redisService.client.keys(pattern);
    res.json({
      success: true,
      data: {
        keys: keys,
        count: keys.length
      }
    });
  } catch (error) {
    console.error('Cache keys error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cache keys'
    });
  }
});

// Health check endpoint - PRODUCTION OPTIMIZED WITH MONITORING
app.get('/api/health', async (req, res) => {
  // Check MongoDB connection
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  // Check Redis connection
  const redisStatus = redisService.isAvailable() ? 'connected' : 'disconnected';
  const redisStats = await redisService.getStats();
  
  // Get comprehensive health status
  const healthStatus = await getHealthStatus();
  
  // Check memory usage
  const memUsage = process.memoryUsage();
  const memUsageMB = {
    rss: Math.round(memUsage.rss / 1024 / 1024),
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
    external: Math.round(memUsage.external / 1024 / 1024)
  };
  
  const status = healthStatus && healthStatus.healthScore && healthStatus.healthScore >= 90 ? 'ok' : 'warning';

  res.json({ 
    status: status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus,
    redis: redisStatus,
    memory: memUsageMB,
    environment: process.env.NODE_ENV || 'development',
    monitoring: healthStatus,
    cache: redisStats,
  });
});

// Cart system health check endpoint
app.get('/api/cart/health', (req, res) => {
  res.json({ 
    status: 'ok',
    cartSystem: 'operational',
    timestamp: new Date().toISOString(),
    endpoints: {
      'POST /api/cart/calculate-total': 'public - no auth required',
      'POST /api/cart/get-items': 'public - no auth required',
      'POST /api/cart/get': 'protected - requires auth',
      'POST /api/cart/add': 'protected - requires auth',
      'POST /api/cart/update': 'protected - requires auth',
      'POST /api/cart/remove': 'protected - requires auth'
    }
  });
});

// Debug endpoint for troubleshooting checkout flow issues
app.get('/api/debug/checkout-flow', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'Checkout flow debug endpoint',
    timestamp: new Date().toISOString(),
    frontendEndpoints: {
      'GET /checkout': 'Cart checkout (default)',
      'GET /checkout?mode=buynow': 'Buy now checkout',
      'GET /checkout?mode=cart': 'Cart checkout (explicit)'
    },
    backendEndpoints: {
      'POST /api/cart/calculate-total': 'Calculate cart total with offers',
      'POST /api/cart/get-items': 'Get cart items by userId (public)',
      'POST /api/cart/get': 'Get cart data (protected)'
    },
    storageKeys: {
      frontend: [
        'buyNowItem',
        'buyNowCheckoutData', 
        'buyNowCheckoutFlow',
        'buyNowCheckoutItems',
        'cartItems',
        'cartCheckoutData',
        'cartCheckoutFlow',
        'cartCheckoutItems'
      ]
    }
  });
});

// SECURITY: CSRF token endpoint for state-changing operations
app.get('/api/csrf-token', async (req, res) => {
  try {
    // SECURITY: Generate CSRF token for form protection
    const csrfToken = randomBytes(32).toString('hex');
    
    // Import Instagram browser utils
    const { getCookieOptions } = await import('./utils/instagramBrowserUtils.js');
    
    // SECURITY: Set CSRF token in HttpOnly cookie with Instagram browser support
    res.cookie('csrf-token', csrfToken, getCookieOptions(req, {
      maxAge: 60 * 60 * 1000 // 1 hour
    }));
    
    res.json({ 
      success: true, 
      csrfToken,
      message: 'CSRF token generated successfully'
    });
  } catch (error) {
    console.error('CSRF token generation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate CSRF token' 
    });
  }
});

// CORS error handler - simplified
app.use((err, req, res, next) => {
    if (err.message === 'Not allowed by CORS') {
        Logger.warn('cors_error', {
            method: req.method,
            path: req.path,
            ip: req.ip,
            timestamp: new Date().toISOString()
        });
        
        res.status(403).json({
            success: false,
            message: 'CORS: Origin not allowed'
        });
    } else {
        next(err);
    }
});

// Add Sentry error handler (non-intrusive - only in production and if available)
if (Sentry && process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  app.use(Sentry.errorHandler());
}

// NEW: Production-grade error handling middleware
app.use(expressErrorHandler);

// Initialize Firebase Admin SDK
try {
  if (!admin.apps.length) {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      console.log('🔧 Firebase credentials path:', serviceAccountPath);
      
      // Check if file exists
      if (existsSync(serviceAccountPath)) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccountPath),
        });
        console.log('✅ Firebase Admin SDK initialized with service account');
      } else {
        console.error('❌ Firebase credentials file not found:', serviceAccountPath);
        console.log('Server will continue without Firebase Admin SDK');
      }
    } else if (process.env.NODE_ENV === 'development') {
      // For development, try to initialize with project ID only
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'maternity-test',
      });
      console.log('Firebase Admin SDK initialized with project ID only (development mode)');
    } else {
      console.warn('WARNING: GOOGLE_APPLICATION_CREDENTIALS is not set. Firebase Admin SDK will not be available for token verification.');
      console.log('Server will continue without Firebase Admin SDK');
    }
  }
} catch (error) {
  console.error('Firebase Admin SDK initialization failed:', error.message);
  console.log('Server will continue without Firebase Admin SDK');
}

// Initialize Sentry dynamically (now handled at the top of the file)
async function initializeSentry() {
  // Already initialized at the top with dynamic import
  if (SentryNode && process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    console.log('✅ Sentry initialized for error monitoring');
  } else {
    console.log('⚠️ Sentry not available or not configured');
  }
}

// Initialize Sentry and start server
async function startServer() {
  await initializeSentry();
  
  // Start the server
  const server = app.listen(PORT, '0.0.0.0', () => {
      Logger.info('server_started', {
        port: PORT,
        nodeEnv: process.env.NODE_ENV,
        mongodbConfigured: !!process.env.MONGODB_URI,
        jwtConfigured: !!process.env.JWT_SECRET,
        phonepeConfigured: !!process.env.PHONEPE_MERCHANT_ID,
        timestamp: new Date().toISOString()
      });
      
      // Start reconciliation cron job for draft orders
      startReconciliationCron();
      Logger.info('reconciliation_cron_started');
      
      // NEW: Start production-grade monitoring
      Logger.info('starting_monitoring_system');
      startPeriodicMonitoring();
      Logger.info('monitoring_system_active');
  });
  
  return server;
}

const server = await startServer();

// Handle server errors
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        Logger.error('server_port_in_use', error, { port: PORT, critical: true });
        console.error(`❌ Port ${PORT} is already in use. Please choose a different port or stop the running process.`);
    } else {
        Logger.error('server_error', error, { critical: true });
        console.error('❌ Server error:', error);
    }
});

// Graceful shutdown handlers
const gracefulShutdown = (signal) => {
    Logger.warn('server_shutdown_initiated', { signal, timestamp: Date.now() });
    console.log(`\n🛑 Received ${signal}. Performing graceful shutdown...`);
    server.close(() => {
        Logger.info('server_closed', { signal });
        console.log('✅ Server closed. Exiting process.');
        process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
        Logger.warn('server_forced_shutdown', { signal, reason: 'timeout' });
        console.log('⚠️ Forcing shutdown after timeout');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

console.log('🚀 Backend server started successfully!');
