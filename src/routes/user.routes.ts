import { Router } from 'express';
const  { body }  = require('express-validator');
import { adminMiddleware, authMiddleware } from '../middleware/auth.middleware';
import userControllers from '../controllers/user.controllers';
import validate from '../middleware/validation.middleware';
import { connectSalesforce } from '../controllers/salesforce.controller';


const router = Router();

router.use(authMiddleware);
router.post('/:id/salesforce', connectSalesforce);
router.get('/', adminMiddleware, userControllers.getAllUsers);

router.get('/:id', userControllers.getUserById);

router.put(
  '/:id',
  [
    body('email').optional().isEmail().withMessage('Please provide a valid email'),
    body('name').optional().notEmpty().withMessage('Name is required'),
    body('password')
      .optional()
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('role').optional().isIn(['USER', 'ADMIN']).withMessage('Invalid role'),
    body('isActive').optional().isBoolean().withMessage('Invalid active status'),
  ],
  validate,
  userControllers.updateUser
);

router.delete('/:id', adminMiddleware, userControllers.deleteUser);

export default router;