import express from 'express';
import { loginUser,registerUser,adminLogin, getUserInfo } from '../controllers/userController.js';
import { verifyToken } from '../middleware/auth.js';

const userRouter = express.Router();

userRouter.post('/register',registerUser)
userRouter.post('/login',loginUser)
userRouter.post('/admin',adminLogin)
userRouter.get('/info', verifyToken, getUserInfo);

export default userRouter;