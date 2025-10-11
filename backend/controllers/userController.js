import validator from "validator";
import bcrypt from "bcrypt"
import jwt from 'jsonwebtoken'
import userModel from "../models/userModel.js";

const createToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// Route for user login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: "User doesn't exists" })
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            const token = createToken({ 
                id: user._id,
                email: user.email,
                role: 'user'
            });
            res.json({ success: true, token })
        }
        else {
            res.json({ success: false, message: 'Invalid credentials' })
        }

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// Route for user register
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // checking user already exists or not
        const exists = await userModel.findOne({ email });
        if (exists) {
            return res.json({ success: false, message: "User already exists" })
        }

        // validating email format & strong password
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" })
        }
        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" })
        }

        // hashing user password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = new userModel({
            name,
            email,
            password: hashedPassword
        })

        const user = await newUser.save()

        const token = createToken({ 
            id: user._id,
            email: user.email,
            role: 'user'
        });

        res.json({ success: true, token })

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// Route for admin login
const adminLogin = async (req, res) => {
    try {
        console.log('Admin login attempt:', { 
            email: req.body.email, 
            hasPassword: !!req.body.password,
            adminEmail: process.env.ADMIN_EMAIL,
            hasAdminPassword: !!process.env.ADMIN_PASSWORD
        });

        const {email, password} = req.body

        if (!email || !password) {
            return res.status(400).json({
                success: false, 
                message: "Email and password are required"
            });
        }

        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const token = createToken({
                email: email,
                role: 'admin',
                id: 'admin' // Adding an ID for consistency
            });
            console.log('Admin login successful for:', email);
            return res.status(200).json({success: true, token});
        } else {
            console.log('Admin login failed - invalid credentials for:', email);
            return res.status(401).json({
                success: false, 
                message: "Invalid credentials"
            });
        }

    } catch (error) {
        console.error('Admin login error:', error);
        return res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    }
}

export const getUserInfo = async (req, res) => {
  try {
    console.log('getUserInfo called with user:', req.user);
    
    const userId = req.user.id;
    const userRole = req.user.role;
    
    console.log('User ID:', userId, 'Role:', userRole);
    
    // Handle admin users differently since they don't exist in the user collection
    if (userRole === 'admin') {
      console.log('Processing admin user');
      return res.json({ 
        success: true, 
        user: {
          name: 'Admin',
          email: req.user.email,
          role: 'admin'
        }
      });
    }
    
    // For regular users, fetch from database
    console.log('Processing regular user, fetching from database');
    const user = await userModel.findById(userId).select('name email');
    if (!user) {
      console.log('User not found in database');
      return res.json({ success: false, message: 'User not found' });
    }
    console.log('User found:', user);
    res.json({ success: true, user });
  } catch (error) {
    console.error('getUserInfo error:', error);
    res.json({ success: false, message: error.message });
  }
};

export { loginUser, registerUser, adminLogin }