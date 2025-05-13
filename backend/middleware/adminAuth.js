import jwt from 'jsonwebtoken'

const adminAuth = async (req, res, next) => {
    try {
        const { token } = req.headers;
        
        if (!token) {
            return res.status(401).json({ success: false, message: "Not Authorized - No token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Not Authorized - Admin access required" });
        }

        req.user = decoded;
        next();
    } catch (error) {
        console.log('Admin Auth Error:', error);
        res.status(401).json({ success: false, message: "Not Authorized - Invalid token" });
    }
}

export default adminAuth;