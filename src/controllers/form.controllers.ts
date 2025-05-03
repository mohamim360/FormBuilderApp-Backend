import { NextFunction, Request, Response } from 'express';
const {  validationResult } = require('express-validator');

import formService from '../services/form.service';
import { JwtPayload } from '../types';

const createForm = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
     res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = (req as any).user as JwtPayload;
    const { templateId, answers } = req.body;

    const form = await formService.createForm(templateId, user.userId, answers);
    res.status(201).json(form);
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'Server error';
    res.status(500).json({ message: errorMessage });
  }
};

const getForm = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user as JwtPayload;

    const form = await formService.getFormById(id, user.userId);
    res.json(form);
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'Server error';
    res.status(500).json({ message: errorMessage });
  }
};

const updateForm = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
     res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const user = (req as any).user as JwtPayload;
    const { answers } = req.body;

    const form = await formService.updateForm(id, user.userId, answers);
    res.json(form);
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'Server error';
    res.status(500).json({ message: errorMessage });
  }
};

const deleteForm = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user as JwtPayload;

    await formService.deleteForm(id, user.userId);
    res.json({ message: 'Form deleted successfully' });
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'Server error';
    res.status(500).json({ message: errorMessage });
  }
};

const getUserForms = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user as JwtPayload;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await formService.getUserForms(user.userId, page, limit);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export default {
  createForm,
  getForm,
  updateForm,
  deleteForm,
  getUserForms,
};