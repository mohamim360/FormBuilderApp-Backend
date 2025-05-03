import {  QuestionType, TemplateAccess, UserRole } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  role: UserRole;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export interface QuestionInput {
  title: string;
  description: string;
  type: QuestionType;
  isRequired: boolean;
  showInTable: boolean;
  options?: string[];
}

export interface TemplateInput {
  title: string;
  description: string;
  topic: string;
  isPublic: boolean;
  access: TemplateAccess;
  questions: QuestionInput[];
  tags: string[];
  allowedUserIds?: string[];
}

export interface FormInput {
  templateId: string;
  answers: {
    questionId: string;
    textValue?: string;
    numericValue?: number;
    booleanValue?: boolean;
  }[];
}

export interface CommentInput {
  content: string;
}

export interface UserUpdateInput {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  isActive?: boolean;
}