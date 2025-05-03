import { Router } from 'express';
const  { body }  = require('express-validator');
import validate from '../middleware/validation.middleware';
import { register, login, getMe } from '../controllers/auth.controllers';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();


router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('name').notEmpty().withMessage('Name is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
  ],
  validate,
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
 login
);

router.get('/me',authMiddleware, getMe);

export default router;