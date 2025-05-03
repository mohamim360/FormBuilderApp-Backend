import { NextFunction, Request, Response } from 'express';
const {  validationResult } = require('express-validator');

import templateService from '../services/template.service';
import { JwtPayload } from '../types';

const createTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
     res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = (req as any).user as JwtPayload;
    const {
      title,
      description,
      topic,
      isPublic,
      access,
      questions,
      tags,
      allowedUserIds,
      userId
    } = req.body;

    const image = req.file;

    const template = await templateService.createTemplate(
      userId,
      title,
      description,
      topic,
      isPublic,
      access,
      questions,
      tags,
      allowedUserIds,
      image
    );

    res.status(201).json(template);
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'Server error';
    res.status(500).json({ message: errorMessage });
  }
};

const getTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user as JwtPayload;

    const template = await templateService.getTemplateById(id, user?.userId);
    if (!template) {
       res.status(404).json({ message: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'Server error';
    res.status(500).json({ message: errorMessage });
  }
};

const updateTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
     res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const user = (req as any).user as JwtPayload;
    const {
      title,
      description,
      topic,
      isPublic,
      access,
      questions,
      tags,
      allowedUserIds,
    } = req.body;

    const image = req.file;

    const template = await templateService.updateTemplate(
      id,
      user.userId,
      {
        title,
        description,
        topic,
        isPublic,
        access,
        questions,
        tags,
        allowedUserIds,
      },
      image
    );

    res.json(template);
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'Server error';
    res.status(500).json({ message: errorMessage });
  }
};

const deleteTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user as JwtPayload;

    await templateService.deleteTemplate(id, user.userId);
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'Server error';
    res.status(500).json({ message: errorMessage });
  }
};

const searchTemplates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { q } = req.query;
    const user = (req as any).user as JwtPayload;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!q) {
       res.status(400).json({ message: 'Search query is required' });
    }

    const result = await templateService.searchTemplates(
      q as string,
      user?.userId,
      page,
      limit
    );

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getPopularTemplates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    const templates = await templateService.getPopularTemplates(limit);
    res.json(templates);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getLatestTemplates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const templates = await templateService.getLatestTemplates(limit);
    res.json(templates);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getTemplatesByTag = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { tag } = req.params;
    const user = (req as any).user as JwtPayload;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await templateService.getTemplatesByTag(
      tag,
      user?.userId,
      page,
      limit
    );

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getUserTemplates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user as JwtPayload;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await templateService.getUserTemplates(
      user.userId,
      page,
      limit
    );

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getTemplateForms = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user as JwtPayload;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await templateService.getTemplateForms(
      id,
      user.userId,
      page,
      limit
    );

    res.json(result);
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'Server error';
    res.status(500).json({ message: errorMessage });
  }
};

const getTemplateStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user as JwtPayload;

    const result = await templateService.getTemplateStats(id, user.userId);
    res.json(result);
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'Server error';
    res.status(500).json({ message: errorMessage });
  }
};

const addComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
     res.status(400).json({ errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const user = (req as any).user as JwtPayload;
    const { content } = req.body;

    const comment = await templateService.addComment(id, user.userId, content);
    res.status(201).json(comment);
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'Server error';
    res.status(500).json({ message: errorMessage });
  }
};

const getComments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await templateService.getComments(id, page, limit);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const likeTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user as JwtPayload;

    await templateService.likeTemplate(id, user.userId);
    res.json({ message: 'Template liked successfully' });
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'Server error';
    res.status(500).json({ message: errorMessage });
  }
};

const unlikeTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user as JwtPayload;

    await templateService.unlikeTemplate(id, user.userId);
    res.json({ message: 'Template unliked successfully' });
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'Server error';
    res.status(500).json({ message: errorMessage });
  }
};

const checkUserLike = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user as JwtPayload;

    const like = await templateService.checkUserLike(id, user.userId);
    res.json({ liked: !!like });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getPopularTags = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const tags = await templateService.getPopularTags(limit);
    res.json(tags);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export default {
  createTemplate,
  getTemplate,
  updateTemplate,
  deleteTemplate,
  searchTemplates,
  getPopularTemplates,
  getLatestTemplates,
  getTemplatesByTag,
  getUserTemplates,
  getTemplateForms,
  getTemplateStats,
  getPopularTags,
  addComment,
  getComments,
  likeTemplate,
  unlikeTemplate,
  checkUserLike,
}