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

// App Config
const app = express()
const port = process.env.PORT || 4000

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
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});

// Apply rate limiting to all routes
app.use(limiter);

// Apply stricter rate limiting to auth routes
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 attempts per hour
    message: 'Too many login attempts, please try again later'
});

app.use('/api/user/login', authLimiter);
app.use('/api/user/admin', authLimiter);

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data: https: http:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; connect-src 'self' https: http:;");
    next();
});

// CORS configuration
const allowedOrigins = [
    'https://admin.jjtextiles.com',
    'https://www.jjtextiles.com',
    'https://jjtextiles.com',
    'http://localhost:5173',
    'http://localhost:3000'
];

const corsOptions = {
    origin: function (origin, callback) {
        console.log('Incoming request from origin:', origin);
        
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            console.log('No origin provided, allowing request');
            return callback(null, true);
        }
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            console.log('Origin allowed:', origin);
            callback(null, true);
        } else {
            console.log('CORS blocked request from origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'token', 'x-requested-with', 'Accept', 'Origin', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400 // 24 hours
}

// Debug middleware for CORS
app.use((req, res, next) => {
    console.log('Request Headers:', req.headers);
    console.log('Request Method:', req.method);
    console.log('Request URL:', req.url);
    next();
});

// middlewares
app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
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
            headers: req.headers
        });
        
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

const server = app.listen(port, () => console.log(`Server running on port ${port}`))

// Handle server errors
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use. Please choose a different port or stop the running process.`);
        process.exit(1);
    } else {
        console.error('Server error:', error);
    }
});