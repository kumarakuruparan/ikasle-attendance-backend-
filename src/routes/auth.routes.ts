import { Router } from 'express';
import { getMe, updateMe } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { updateProfileSchema } from '../validators/user.validator';

const router = Router();

// All auth/me routes require authentication
router.use(requireAuth);

// GET /api/me - Retrieve current authenticated application user profile
router.get('/', getMe);

// PATCH /api/me & PATCH /api/me/profile - Update employee self profile (safe fields only)
router.patch('/', validate(updateProfileSchema), updateMe);
router.patch('/profile', validate(updateProfileSchema), updateMe);

export default router;
