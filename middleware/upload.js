import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../public/uploads/catches/');

// Ensure upload directory exists
const ensureDirExists = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
};

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        try {
            ensureDirExists(uploadDir);
            cb(null, uploadDir);
        } catch (err) {
            console.error('Error creating upload directory:', err);
            cb(err);
        }
    },
    filename: (req, file, cb) => {
        try {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(file.originalname).toLowerCase();
            cb(null, 'catch-' + uniqueSuffix + ext);
        } catch (err) {
            console.error('Error generating filename:', err);
            cb(err);
        }
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    try {
        const filetypes = /jpe?g|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            const error = new Error('Only image files are allowed (jpeg, jpg, png, gif)');
            error.code = 'INVALID_FILE_TYPE';
            return cb(error, false);
        }
    } catch (err) {
        console.error('Error in file filter:', err);
        cb(err);
    }
};

// Initialize upload with error handling
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { 
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 1
    }
});

// Custom middleware to handle file upload errors
const handleUploadErrors = (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            console.error('File upload error:', {
                message: err.message,
                code: err.code,
                field: err.field
            });

            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ 
                    errors: [{ msg: 'File size too large. Maximum size is 5MB.' }] 
                });
            } else if (err.code === 'INVALID_FILE_TYPE') {
                return res.status(400).json({ 
                    errors: [{ msg: err.message }] 
                });
            } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                return res.status(400).json({ 
                    errors: [{ msg: 'Only one file is allowed' }] 
                });
            }
            
            // For other errors
            return res.status(400).json({ 
                errors: [{ msg: 'File upload failed: ' + err.message }] 
            });
        }
        
        // No errors, proceed to next middleware
        next();
    });
};

export const uploadCatchImage = handleUploadErrors;
