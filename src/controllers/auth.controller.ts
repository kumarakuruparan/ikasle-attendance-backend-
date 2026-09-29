import { Request, Response, NextFunction } from 'express';
import { sanitizeUser, updateSelfProfile } from '../services/user.service';
import { sendSuccess } from '../utils/response';
import { UnauthorizedError } from '../utils/errors';

export const getMe = (req: Request, res: Response) => {
  if (!req.currentUser) {
    throw new UnauthorizedError('User session not found');
  }

  const safeProfile = sanitizeUser(req.currentUser);

  return sendSuccess(res, {
    data: safeProfile,
    message: 'Profile retrieved successfully',
  });
};

export const updateMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.currentUser) {
      throw new UnauthorizedError('User session not found');
    }

    const updated = await updateSelfProfile(req.currentUser.id, req.body);

    return sendSuccess(res, {
      data: updated,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    next(error);
  }
};
