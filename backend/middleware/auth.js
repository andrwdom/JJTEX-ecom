import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.token;
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

const isAdmin = async (req, res, next) => {
    const { token } = req.headers;

    if (!token) {
        return res.json({ success: false, message: 'Not Authorized - No token provided' })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.role !== 'admin') {
            return res.json({ success: false, message: 'Not Authorized - Admin access required' });
        }

        req.user = decoded;
        next();
    } catch (error) {
        console.log('Admin Auth Error:', error);
        res.json({ success: false, message: 'Not Authorized - Invalid token' })
    }
}

export { verifyToken, isAdmin }