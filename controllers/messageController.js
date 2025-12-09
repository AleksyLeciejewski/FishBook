// controllers/messageController.js
import Message from '../models/messageModel.js';
import User from '../models/User.js';

// GET: Inbox (all conversations)
export const getInbox = async (req, res) => {
    try {
        // Support multiple session structures
        const userId = req.session.user?._id || req.session.user?.id || req.session.userId;

        // Get all messages involving the user
        const messages = await Message.find({
            $or: [{ sender: userId }, { receiver: userId }]
        })
            .populate('sender receiver', '_id username profilePicture')
            .sort({ createdAt: -1 });

        // Group by conversation partner and get latest message
        const conversationsMap = new Map();

        messages.forEach(msg => {
            const partnerId = msg.sender._id.equals(userId)
                ? msg.receiver._id.toString()
                : msg.sender._id.toString();

            // Only add if not already in map (keeps most recent)
            if (!conversationsMap.has(partnerId)) {
                conversationsMap.set(partnerId, {
                    user: msg.sender._id.equals(userId) ? msg.receiver : msg.sender,
                    lastMessage: msg.content,
                    lastMessageTime: msg.createdAt
                });
            }
        });

        // Convert to array and sort by most recent
        const conversations = Array.from(conversationsMap.values())
            .sort((a, b) => b.lastMessageTime - a.lastMessageTime);

        res.render('messages/inbox', {
            title: "Inbox",
            conversations
        });
    } catch (error) {
        console.error('Error getting inbox:', error);
        res.status(500).render('error', {
            title: 'Error',
            error: 'Failed to load inbox',
            message: error.message
        });
    }
};

// GET: Conversation with specific user
export const getConversation = async (req, res) => {
    try {
        const userId = req.session.user?._id || req.session.user?.id || req.session.userId;
        const otherUserId = req.params.userId;

        // Validate other user ID
        if (!otherUserId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).render('error', {
                title: 'Invalid User',
                error: 'Invalid user ID',
                message: null
            });
        }

        // Check if other user exists
        const otherUser = await User.findById(otherUserId).select('username profilePicture');
        if (!otherUser) {
            return res.status(404).render('error', {
                title: 'User Not Found',
                error: 'User not found',
                message: null
            });
        }

        // Prevent messaging yourself
        if (userId.toString() === otherUserId.toString()) {
            return res.status(400).render('error', {
                title: 'Invalid Action',
                error: 'You cannot message yourself',
                message: null
            });
        }

        // Get all messages between the two users
        const messages = await Message.find({
            $or: [
                { sender: userId, receiver: otherUserId },
                { sender: otherUserId, receiver: userId }
            ]
        })
            .populate('sender receiver', 'username profilePicture')
            .sort({ createdAt: 1 });

        res.render('messages/conversation', {
            messages,
            otherUser,
            currentUserId: userId
        });
    } catch (error) {
        console.error('Error getting conversation:', error);
        res.status(500).render('error', {
            title: 'Error',
            error: 'Failed to load conversation',
            message: error.message
        });
    }
};

// POST: Send message
export const sendMessage = async (req, res) => {
    try {
        const senderId = req.session.user?._id || req.session.user?.id || req.session.userId;
        const { receiverId, content } = req.body;

        // Validation
        if (!receiverId || !content) {
            return res.status(400).send('Missing required fields');
        }

        const trimmedContent = content.trim();

        if (trimmedContent.length === 0) {
            return res.status(400).send('Message cannot be empty');
        }

        if (trimmedContent.length > 2000) {
            return res.status(400).send('Message too long (max 2000 characters)');
        }

        // Validate receiver ID format
        if (!receiverId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).send('Invalid receiver ID');
        }

        // Check if receiver exists
        const receiverExists = await User.findById(receiverId);
        if (!receiverExists) {
            return res.status(404).send('Receiver not found');
        }

        // Prevent sending to self
        if (senderId.toString() === receiverId.toString()) {
            return res.status(400).send('Cannot send message to yourself');
        }

        // Create message
        await Message.create({
            sender: senderId,
            receiver: receiverId,
            content: trimmedContent
        });

        // Redirect back to conversation
        res.redirect(`/messages/${receiverId}`);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).send('Failed to send message');
    }
};