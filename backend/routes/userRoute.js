import express from 'express';
import { loginUser,registerUser,adminLogin, getUserInfo } from '../controllers/userController.js';
import { verifyToken } from '../middleware/auth.js';
import adminAuth from '../middleware/adminAuth.js';

const userRouter = express.Router();

userRouter.post('/register',registerUser)
userRouter.post('/login',loginUser)
userRouter.post('/admin', (req, res, next) => {
  console.log('POST /api/user/admin hit', req.method, req.body);
  next();
}, adminLogin)
userRouter.get('/info', verifyToken, getUserInfo);

// Test endpoint for admin authentication
userRouter.get('/admin-test', adminAuth, (req, res) => {
  console.log('Admin test endpoint hit');
  res.json({ 
    success: true, 
    message: 'Admin authentication working',
    user: req.user 
  });
});

export default userRouter;