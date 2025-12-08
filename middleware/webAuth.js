import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const webAuth = async (req, res, next) => {
  try {
    // Get token from cookies
    const token = req.cookies.token;

    // Check if no token
    if (!token) {
      return res.redirect('/auth/login');
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Add user from payload
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      console.log('User not found for token:', decoded);
      res.clearCookie('token');
      return res.redirect('/auth/login');
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Web auth middleware error:', err.message);
    res.clearCookie('token');
    res.redirect('/auth/login');
  }
};

export default webAuth;
