import express from 'express';
import { check } from 'express-validator';
import {
    createOrUpdateDraft,
    getDrafts,
    getDraftById,
    deleteDraft
} from '../controllers/draftController.js';
import sessionAuth from '../middleware/sessionAuth.js';

const router = express.Router();

router.post(
    '/',
    [
        sessionAuth,
        [
            check('type', 'Type is required and must be catch or trip').isIn(['catch', 'trip'])
        ]
    ],
    createOrUpdateDraft
);

router.get('/', sessionAuth, getDrafts);
router.get('/:id', sessionAuth, getDraftById);
router.delete('/:id', sessionAuth, deleteDraft);

export default router;