import express from 'express';
import { loginUser,registerUser,adminLogin, getUserInfo } from '../controllers/userController.js';
import { verifyToken } from '../middleware/auth.js';

const userRouter = express.Router();

userRouter.post('/register',registerUser)
userRouter.post('/login',loginUser)
userRouter.post('/admin', (req, res, next) => {
  console.log('POST /api/user/admin hit', req.method, req.body);
  next();
}, adminLogin)
userRouter.get('/info', verifyToken, getUserInfo);

export default userRouter;