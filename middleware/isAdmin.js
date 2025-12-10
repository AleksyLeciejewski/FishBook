import mongoose from 'mongoose';
import User from '../models/User.js';

export default async function isAdmin(req, res, next) {
    try {

        const sessionUser = req.session && req.session.user;
        if (!sessionUser) {
            return res.status(401).render('error', {
                title: 'Unauthorized',
                error: 'Authentication required',
                message: 'Please log in to access this page'
            });
        }

        const possibleId = sessionUser.id || sessionUser._id || (sessionUser._doc && (sessionUser._doc.id || sessionUser._doc._id));
        let user = null;

        if (possibleId && mongoose.Types.ObjectId.isValid(possibleId)) {
            user = await User.findById(possibleId).select('role email username').lean();
        }

        if (!user && sessionUser.email) {
            user = await User.findOne({ email: sessionUser.email }).select('role email username').lean();
        }

        if (!user && sessionUser.username) {
            user = await User.findOne({ username: sessionUser.username }).select('role email username').lean();
        }

        if (!user) {
            return res.status(401).render('error', {
                title: 'Unauthorized',
                error: 'User not found',
                message: 'Session does not match a valid user — please re-login'
            });
        }

        if (user.role !== 'admin') {
            return res.status(403).render('error', {
                title: 'Forbidden',
                error: 'Access denied',
                message: 'Admin access required'
            });
        }

        // Refresh session and locals so views/middlewares see updated role
        req.session.user = {
            ...req.session.user,
            id: user._id ? user._id.toString() : req.session.user.id,
            role: user.role,
            email: user.email,
            username: user.username
        };
        res.locals.currentUser = req.session.user;

        next();
    } catch (err) {
        console.error('isAdmin error:', err);
        res.status(500).render('error', {
            title: 'Server Error',
            error: 'Internal server error',
            message: process.env.NODE_ENV === 'development' ? err.stack : null
        });
    }
}
