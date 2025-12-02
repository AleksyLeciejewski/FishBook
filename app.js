import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import methodOverride from 'method-override';
import dotenv from 'dotenv';
import fileUpload from 'express-fileupload';

// Import routes
import indexRouter from './routes/index.js';
import authRouter from './routes/auth.js';
import catchRouter from './routes/catches.js';
import tripRouter from './routes/trips.js';
import userRouter from './routes/users.js';
import weatherRouter from './routes/weather.js';

// Load environment variables
dotenv.config();


// Initialize express
const app = express();

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// View engine setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// File upload middleware
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  createParentPath: true,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  abortOnLimit: true
}));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 14 * 24 * 60 * 60 // 14 days
  })
}));

// Make user data available to all templates
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

// API Routes
app.use('/api/weather', weatherRouter);

// Application Routes
app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/catches', catchRouter);
app.use('/trips', tripRouter);
app.use('/users', userRouter);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    
    // Set the status code
    const statusCode = err.status || 500;
    
    // Log the error in development
    if (process.env.NODE_ENV === 'development') {
        console.error('Error details:', {
            message: err.message,
            stack: err.stack,
            path: req.path,
            method: req.method,
            body: req.body
        });
    }
    
    // Handle API errors
    if (req.originalUrl.startsWith('/api/')) {
        return res.status(statusCode).json({
            success: false,
            error: err.message || 'Internal Server Error',
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        });
    }
    
    // Handle view errors
    res.status(statusCode).render('error', {
        title: 'Error',
        error: err.message || 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.stack : null
    });
});

// 404 handler (must be after all other routes)
app.use((req, res) => {
    if (req.originalUrl.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            error: 'Endpoint not found'
        });
    }
    
    res.status(404).render('404', {
        title: 'Page Not Found',
        path: req.originalUrl
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;
