import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import rateLimit from 'express-rate-limit'
import connectDB from './config/mongodb.js'
import { cloudinary } from './config/cloudinary.js'
import userRouter from './routes/userRoute.js'
import productRouter from './routes/productRoute.js'
import cartRouter from './routes/cartRoute.js'
import orderRouter from './routes/orderRoute.js'
import couponRouter from './routes/couponRoutes.js'
import carouselRouter from './routes/carouselRoutes.js'
import net from 'net'

// App Config
const app = express()
const port = process.env.PORT || 4000

// Function to check if a port is in use
function checkPort(port) {
    return new Promise((resolve) => {
        const tester = net.createServer()
            .once('error', err => (err.code === 'EADDRINUSE' ? resolve(true) : resolve(false)))
            .once('listening', () => tester.once('close', () => resolve(false)).close())
            .listen(port)
    })
}

async function startServer() {
    let currentPort = port
    while (await checkPort(currentPort)) {
        console.warn(`Port ${currentPort} is in use. Trying next port...`)
        currentPort++
    }
    app.listen(currentPort, () => {
        console.log(`Server running on port ${currentPort}`)
    })
}

startServer()

// Trust proxy - required for rate limiting behind reverse proxy
app.set('trust proxy', 1)

// Connect to MongoDB
connectDB()

// Debug logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for admin domain and OPTIONS requests
        return req.headers.origin === 'https://admin.jjtextiles.com' || req.method === 'OPTIONS';
    }
});

// Apply rate limiting to all routes
app.use(limiter);

// Apply rate limiting to auth routes with higher limits
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 attempts per hour
    message: 'Too many login attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for admin domain and OPTIONS requests
        return req.headers.origin === 'https://admin.jjtextiles.com' || req.method === 'OPTIONS';
    }
});

// Apply auth rate limiting only to specific routes
app.use('/api/user/login', authLimiter);
app.use('/api/user/admin', authLimiter);

// Security headers
app.use((req, res, next) => {
    // Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    // Update CSP to allow admin domain
    res.setHeader('Content-Security-Policy', 
        "default-src 'self' https://admin.jjtextiles.com; " +
        "img-src 'self' data: https: http:; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; " +
        "style-src 'self' 'unsafe-inline' https:; " +
        "connect-src 'self' https://api.jjtextiles.com https://admin.jjtextiles.com;"
    );
    next();
});

// CORS configuration
const allowedOrigins = [
    'https://www.jjtextiles.com',
    'https://jjtextiles.com',
    'https://admin.jjtextiles.com', // if you have admin subdomain
    'http://localhost:3000', // for development
    'http://localhost:5173'  // for Vite dev server
];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        console.log('CORS Request from origin:', origin);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.error('CORS Error: Origin not allowed:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'token']
};

app.use(cors(corsOptions)); // Apply CORS to all routes before other middleware

// Handle preflight requests
app.options('*', cors(corsOptions));

// middlewares
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static('uploads'))

// api endpoints
app.use('/api/user', userRouter)
app.use('/api/product', productRouter)
app.use('/api/cart', cartRouter)
app.use('/api/order', orderRouter)
app.use('/api/coupons', couponRouter)
app.use('/api/carousel', carouselRouter)

app.get('/', (req, res) => {
    res.send("API Working")
})

// CORS error handler
app.use((err, req, res, next) => {
    if (err.message === 'Not allowed by CORS') {
        console.error('CORS Error Details:', {
            origin: req.headers.origin,
            method: req.method,
            path: req.path,
            headers: req.headers,
            ip: req.ip,
            timestamp: new Date().toISOString()
        });
        
        // Send CORS headers even for errors
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin || 'https://admin.jjtextiles.com');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        
        res.status(403).json({
            success: false,
            message: 'CORS: Origin not allowed',
            origin: req.headers.origin,
            allowedOrigins: allowedOrigins
        });
    } else {
        next(err);
    }
});

// General error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    })
})

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Received SIGTERM. Performing graceful shutdown...');
    app.close(() => {
        console.log('Server closed. Exiting process.');
        process.exit(0);
    });
});

console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET);
