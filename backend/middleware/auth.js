import jwt from 'jsonwebtoken'
import userModel from '../models/userModel.js'

const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.token;
        
        console.log('verifyToken called with token:', token ? token.substring(0, 20) + '...' : 'no token');
        
        if (!token) {
            console.log('No token provided');
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decoded:', decoded);
        
        // Handle admin tokens differently since they don't exist in the user collection
        if (decoded.role === 'admin') {
            console.log('Admin token detected, setting req.user');
            req.user = decoded;
            return next();
        }
        
        // For regular users, verify they exist in the database
        console.log('Regular user token, checking database for user ID:', decoded.id);
        const user = await userModel.findById(decoded.id);
        if (!user) {
            console.log('User not found in database');
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }

        console.log('User found in database:', user);
        req.user = user;
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

const isAdmin = async (req, res, next) => {
    const { token } = req.headers;

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Not Authorized - No token provided' 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Not Authorized - Admin access required' 
            });
        }

        req.user = decoded;
        next();
    } catch (error) {
        console.log('Admin Auth Error:', error);
        return res.status(401).json({ 
            success: false, 
            message: 'Not Authorized - Invalid token' 
        });
    }
}

export { verifyToken, isAdmin }