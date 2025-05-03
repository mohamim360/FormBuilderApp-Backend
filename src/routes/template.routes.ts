import { Router } from 'express';
const  { body }  = require('express-validator');
import multer from 'multer';
import path from 'path';
import templateController from '../controllers/template.controllers';
import { authMiddleware } from '../middleware/auth.middleware';
import validate from '../middleware/validation.middleware';


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage });

const router = Router();

// Public routes
router.get('/search', templateController.searchTemplates);
router.get('/popular', templateController.getPopularTemplates);
router.get('/latest', templateController.getLatestTemplates);
router.get('/tags/popular', templateController.getPopularTags); 
router.get('/tag/:tag', templateController.getTemplatesByTag);
router.get('/:id', templateController.getTemplate);
router.get('/:id/comments', templateController.getComments);

// Protected routes
router.use(authMiddleware);

router.post(
  '/',
  upload.single('image'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('topic').notEmpty().withMessage('Topic is required'),
    body('isPublic').isBoolean().withMessage('isPublic must be a boolean'),
    body('accessType').isIn(['PUBLIC', 'RESTRICTED']).withMessage('Invalid access type'),
    body('questions').isArray().withMessage('Questions must be an array'),
    body('questions.*.title').notEmpty().withMessage('Question title is required'),
    body('questions.*.description').notEmpty().withMessage('Question description is required'),
    body('questions.*.type').isIn(['SINGLE_LINE_TEXT', 'MULTI_LINE_TEXT', 'INTEGER', 'CHECKBOX', 'SINGLE_CHOICE']).withMessage('Invalid question type'),
    body('questions.*.isRequired').isBoolean().withMessage('isRequired must be a boolean'),
    body('questions.*.showInTable').isBoolean().withMessage('showInTable must be a boolean'),
    body('tags').isArray().withMessage('Tags must be an array'),
    body('tags.*').isString().withMessage('Tag must be a string'),
    body('allowedUserIds').optional().isArray().withMessage('allowedUserIds must be an array'),
  ],
  validate,
  templateController.createTemplate
);

router.put(
  '/:id',
  upload.single('image'),
  [
    body('title').optional().notEmpty().withMessage('Title is required'),
    body('description').optional().notEmpty().withMessage('Description is required'),
    body('topic').optional().notEmpty().withMessage('Topic is required'),
    body('isPublic').optional().isBoolean().withMessage('isPublic must be a boolean'),
    body('access').optional().isIn(['PUBLIC', 'RESTRICTED']).withMessage('Invalid access type'),
    body('questions').optional().isArray().withMessage('Questions must be an array'),
    body('questions.*.title').optional().notEmpty().withMessage('Question title is required'),
    body('questions.*.description').optional().notEmpty().withMessage('Question description is required'),
    body('questions.*.type').optional().isIn(['SINGLE_LINE_TEXT', 'MULTI_LINE_TEXT', 'INTEGER', 'CHECKBOX', 'SINGLE_CHOICE']).withMessage('Invalid question type'),
    body('questions.*.isRequired').optional().isBoolean().withMessage('isRequired must be a boolean'),
    body('questions.*.showInTable').optional().isBoolean().withMessage('showInTable must be a boolean'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('tags.*').optional().isString().withMessage('Tag must be a string'),
    body('allowedUserIds').optional().isArray().withMessage('allowedUserIds must be an array'),
  ],
  validate,
  templateController.updateTemplate
);

router.delete('/:id', templateController.deleteTemplate);
router.get('/user/templates', templateController.getUserTemplates);
router.get('/:id/forms', templateController.getTemplateForms);
router.get('/:id/stats', templateController.getTemplateStats);
router.post(
  '/:id/comments',
  [
    body('content').notEmpty().withMessage('Content is required'),
  ],
  validate,
  templateController.addComment
);
router.post('/:id/like', templateController.likeTemplate);
router.delete('/:id/like', templateController.unlikeTemplate);
router.get('/:id/like', templateController.checkUserLike);

export default router;