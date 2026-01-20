import express from 'express';
import mongoose from 'mongoose';
import methodOverride from 'method-override';
import fishingSpotsRouter from '../routes/fishingSpots.js';

// Initialize express
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// Routes needed for testing
app.use('/fishing-spots', fishingSpotsRouter);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    const statusCode = err.status || 500;
    res.status(statusCode).json({
        success: false,
        error: err.message || 'Internal Server Error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

export default app;
