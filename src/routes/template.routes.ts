import { Router, Request, Response } from 'express';
const  { body }  = require('express-validator');
import multer from 'multer';
import path from 'path';
import templateController from '../controllers/template.controllers';
import { authMiddleware } from '../middleware/auth.middleware';
import validate from '../middleware/validation.middleware';
import fs from 'fs';
import cloudinary from 'cloudinary';


const uploadDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Update your storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');
    // Create directory if it doesn't exist
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'image-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

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
// In template.routes.ts
// Extend the Request type to include the 'file' property


router.post(
  '/upload-image',
  upload.single('image'),
  async (req: Request, res: Response): Promise<void> => {  // Note the explicit return type
    try {
      if (!req.file) {
        res.status(400).json({ message: 'No image file provided' });
        return;
      }

      // Verify file exists before uploading to Cloudinary
      if (!fs.existsSync(req.file.path)) {
        res.status(400).json({ message: 'Uploaded file not found' });
        return;
      }

      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: 'forms/templates',
      });

      // Delete the temporary file after upload
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting temporary file:', unlinkError);
      }

      res.json({
        url: result.secure_url,
        publicId: result.public_id,
      });
    } catch (error: unknown) {  // Properly type the error
      console.error('Error uploading image:', error);
      
      // Clean up if something went wrong
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({ 
        message: 'Failed to upload image',
        error: errorMessage 
      });
    }
  }
);
router.post('/:id/like', templateController.likeTemplate);
router.delete('/:id/like', templateController.unlikeTemplate);
router.get('/:id/like', templateController.checkUserLike);

export default router;