import { PrismaClient } from '@prisma/client';
import templateService from './template.service';

const prisma = new PrismaClient();

const createForm = async (templateId: string, userId: string, answers: {
  questionId: string;
  textValue?: string;
  numericValue?: number;
  booleanValue?: boolean;
}[]) => {
  // First, check if user has access to the template
  const template = await templateService.getTemplateById(templateId, userId);
  if (!template) throw new Error('Template not found');

  // Check if template is public or user is allowed
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const hasAccess =
    template.isPublic ||
    template.authorId === userId ||
    template.allowedUsers.some(u => u.id === userId) ||
    user.role === 'ADMIN';

  if (!hasAccess) {
    throw new Error('You do not have access to fill this template');
  }

  // Validate all required questions are answered
  const requiredQuestions = template.questions.filter(q => q.isRequired);
  const answeredQuestionIds = answers.map(a => a.questionId);

  for (const question of requiredQuestions) {
    if (!answeredQuestionIds.includes(question.id)) {
      throw new Error(`Question "${question.title}" is required`);
    }
  }

  // Validate answer types
  for (const answer of answers) {
    const question = template.questions.find(q => q.id === answer.questionId);
    if (!question) throw new Error(`Question with ID ${answer.questionId} not found`);

    if (question.type === 'INTEGER' && answer.numericValue === undefined) {
      throw new Error(`Question "${question.title}" requires a numeric value`);
    }

    if (question.type === 'CHECKBOX' && answer.booleanValue === undefined) {
      throw new Error(`Question "${question.title}" requires a boolean value`);
    }

    if (
      (question.type === 'SINGLE_LINE_TEXT' || question.type === 'MULTI_LINE_TEXT' || question.type === 'SINGLE_CHOICE') &&
      answer.textValue === undefined
    ) {
      throw new Error(`Question "${question.title}" requires a text value`);
    }

    // For single choice, validate the answer is in the options
    if (question.type === 'SINGLE_CHOICE' && answer.textValue) {
      if (!question.options.includes(answer.textValue)) {
        throw new Error(`Answer "${answer.textValue}" is not one of the allowed options`);
      }
    }
  }

  return await prisma.form.create({
    data: {
      templateId,
      userId,
      answers: {
        create: answers.map(answer => ({
          questionId: answer.questionId,
          textValue: answer.textValue,
          numericValue: answer.numericValue,
          booleanValue: answer.booleanValue,
        })),
      },
    },
    include: {
      template: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      answers: {
        include: {
          question: true,
        },
      },
    },
  });
};

const getFormById = async (formId: string, userId: string) => {
  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: {
      template: {
        include: {
          author: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      answers: {
        include: {
          question: true,
        },
      },
    },
  });

  if (!form) throw new Error('Form not found');

  // Check if user is admin, form creator, or template author
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const canView =
    user.role === 'ADMIN' ||
    form.userId === userId ||
    form.template.authorId === userId;

  if (!canView) {
    throw new Error('You are not authorized to view this form');
  }

  return form;
};

const updateForm = async (
  formId: string,
  userId: string,
  answers: {
    questionId: string;
    textValue?: string;
    numericValue?: number;
    booleanValue?: boolean;
  }[]
) => {
  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: {
      template: {
        include: {
          questions: true,
        },
      },
      user: true,
    },
  });

  if (!form) throw new Error('Form not found');

  // Check if user is admin or form creator
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const canEdit =
    user.role === 'ADMIN' || form.userId === userId;

  if (!canEdit) {
    throw new Error('You are not authorized to edit this form');
  }

  // Validate all required questions are answered
  const requiredQuestions = form.template.questions.filter(q => q.isRequired);
  const answeredQuestionIds = answers.map(a => a.questionId);

  for (const question of requiredQuestions) {
    if (!answeredQuestionIds.includes(question.id)) {
      throw new Error(`Question "${question.title}" is required`);
    }
  }

  // First, delete all existing answers
  await prisma.answer.deleteMany({
    where: { formId },
  });

  // Then create new answers
  return await prisma.form.update({
    where: { id: formId },
    data: {
      answers: {
        create: answers.map(answer => ({
          questionId: answer.questionId,
          textValue: answer.textValue,
          numericValue: answer.numericValue,
          booleanValue: answer.booleanValue,
        })),
      },
    },
    include: {
      template: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      answers: {
        include: {
          question: true,
        },
      },
    },
  });
};

const deleteForm = async (formId: string, userId: string) => {
  const form = await prisma.form.findUnique({
    where: { id: formId },
    include: {
      user: true,
    },
  });

  if (!form) throw new Error('Form not found');

  // Check if user is admin or form creator
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const canDelete =
    user.role === 'ADMIN' || form.userId === userId;

  if (!canDelete) {
    throw new Error('You are not authorized to delete this form');
  }

  return await prisma.form.delete({
    where: { id: formId },
  });
};

const getUserForms = async (userId: string, page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;

  const [forms, total] = await Promise.all([
    prisma.form.findMany({
      where: {
        userId,
      },
      skip,
      take: limit,
      include: {
        template: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.form.count({
      where: {
        userId,
      },
    }),
  ]);

  return {
    forms,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export default {
  createForm,
  getFormById,
  updateForm,
  deleteForm,
  getUserForms,
};