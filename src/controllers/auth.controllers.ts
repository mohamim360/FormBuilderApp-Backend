import { NextFunction, Request, Response } from 'express';
const {  validationResult } = require('express-validator');

import userService from '../services/user.service';
import authService from '../services/auth.service';
import { JwtPayload } from '../types';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, name, password } = req.body;
    const existingUser = await userService.getUserByEmail(email);
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const user = await userService.createUser(email, name, password);
    const token = authService.generateToken(user.id, user.role);
    res.status(201).json({ user, token });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password } = req.body;
    const user = await userService.getUserByEmail(email);
    
    if (!user || !user.isActive || !(await authService.comparePasswords(password, user.password))) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const token = authService.generateToken(user.id, user.role);
    res.json({ 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        role: user.role, 
        createdAt: user.createdAt 
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user as JwtPayload;
    const userData = await userService.getUserById(user.userId);
    console.log(userData);
    if (!userData) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json(userData);
  } catch (error) {
    next(error);
  }
};




