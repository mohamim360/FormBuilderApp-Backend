import { NextFunction, Request, Response } from 'express';
const {  validationResult } = require('express-validator');
;
import userService from '../services/user.service';
import { JwtPayload } from '../types';

const getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> =>  {
  try {
    const user = (req as any).user as JwtPayload;
    const currentUser = await userService.getUserById(user.userId);

    if (!currentUser || currentUser.role !== 'ADMIN') {
       res.status(403).json({ message: 'Unauthorized' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await userService.getAllUsers(page, limit);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> =>  {
  try {
    const { id } = req.params;
    const user = (req as any).user as JwtPayload;
    const currentUser = await userService.getUserById(user.userId);

    if (!currentUser) {
       res.status(403).json({ message: 'Unauthorized' });
       return;
    }

    // Only admin or the user themselves can view user details
    if (currentUser.role !== 'ADMIN' && currentUser.id !== id) {
       res.status(403).json({ message: 'Unauthorized' });
       return;
    }


    const userData = await userService.getUserById(id);
    if (!userData) {
       res.status(404).json({ message: 'User not found' });

    }

    res.json(userData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> =>  {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
     res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const user = (req as any).user as JwtPayload;
    const currentUser = await userService.getUserById(user.userId);

    if (!currentUser) {
       res.status(403).json({ message: 'Unauthorized' });
       return;
    }

    // Only admin or the user themselves can update user details
    if (currentUser.role !== 'ADMIN' && currentUser.id !== id) {
       res.status(403).json({ message: 'Unauthorized' });
       return;
    }

    // Prevent non-admins from changing role
    if (currentUser.role !== 'ADMIN' && req.body.role) {
       res.status(403).json({ message: 'Only admins can change user roles' });
       return;
    }

    // Prevent admins from removing their own admin access
    if (currentUser.role === 'ADMIN' && currentUser.id === id && req.body.role === 'USER') {
       res.status(400).json({ message: 'Cannot remove your own admin access' });
    }

    const updatedUser = await userService.updateUser(id, req.body);
    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> =>  {
  try {
    const { id } = req.params;
    const user = (req as any).user as JwtPayload;
    const currentUser = await userService.getUserById(user.userId);

    if (!currentUser || currentUser.role !== 'ADMIN') {
       res.status(403).json({ message: 'Unauthorized' });
       return;
    }

    // Prevent admin from deleting themselves
    if (currentUser.id === id) {
       res.status(400).json({ message: 'Cannot delete your own account' });
       return;
    }

    const deletedUser = await userService.deleteUser(id);
    res.json(deletedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export default {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};