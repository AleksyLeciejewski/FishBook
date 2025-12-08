/**
 * Simple middleware to ensure a user is logged in for HTML form flows.
 * Works with session-based auth and falls back to JWT header for API callers.
 */
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const requireLogin = async (req, res, next) => {
  try {
    const wantsHtml = (req.headers.accept || '').includes('text/html');

    // Session-based auth (used by browser flows)
    if (req.session?.user) {
      req.user = req.session.user;
      return next();
    }

    // Token-based fallback (keeps API compatibility)
    const token = req.header('x-auth-token') || req.cookies?.token;
    if (!token) {
      if (wantsHtml) {
        return res.redirect('/auth/login');
      }
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.id || decoded.user?.id).select('-password');

    if (!user) {
      res.clearCookie('token');
      if (wantsHtml) {
        return res.redirect('/auth/login');
      }
      return res.status(401).json({ msg: 'Authentication required' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Require login middleware error:', err.message);
    if (wantsHtml) {
      res.clearCookie('token');
      return res.redirect('/auth/login');
    }
    return res.status(401).json({ msg: 'Authentication required' });
  }
};

export default requireLogin;

