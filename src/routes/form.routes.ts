import { Router } from 'express';
const  { body }  = require('express-validator');
import formController from '../controllers/form.controllers';
import validate from '../middleware/validation.middleware';
import { authMiddleware } from '../middleware/auth.middleware';


const router = Router();

router.use(authMiddleware);

router.post(
  '/',
  [
    body('templateId').notEmpty().withMessage('Template ID is required'),
    body('answers').isArray().withMessage('Answers must be an array'),
    body('answers.*.questionId').notEmpty().withMessage('Question ID is required'),
  ],
  validate,
  formController.createForm
);

router.get('/user', formController.getUserForms);
router.get('/:id', formController.getForm);
router.put(
  '/:id',
  [
    body('answers').isArray().withMessage('Answers must be an array'),
    body('answers.*.questionId').notEmpty().withMessage('Question ID is required'),
  ],
  validate,
  formController.updateForm
);
router.delete('/:id', formController.deleteForm);

export default router;