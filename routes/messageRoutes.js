// routes/messages.js
import express from 'express';
import sessionAuth from '../middleware/sessionAuth.js';  // ← Session auth, ikke JWT
import {
    getInbox,
    getConversation,
    sendMessage
} from '../controllers/messageController.js';

const router = express.Router();

// Protect all message routes with session authentication
router.use(sessionAuth);

// GET: inbox (all conversations)
router.get('/', getInbox);

// GET: specific conversation with a user
router.get('/:userId', getConversation);

// POST: send a message
router.post('/send', sendMessage);

export default router;