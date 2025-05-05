import { Prisma, PrismaClient, QuestionType, TemplateAccess } from '@prisma/client';
 import cloudinary from 'cloudinary';
import config from '../config/config';

const prisma = new PrismaClient();

cloudinary.v2.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

const createTemplate = async (
  authorId: string,
  title: string,
  description: string,
  topic: string,
  isPublic: boolean,
  access: TemplateAccess,
  questions: {
    title: string;
    description: string;
    type: QuestionType;
    isRequired: boolean;
    showInTable: boolean;
    options?: string[];
  }[],
  tags: string[],
  allowedUserIds?: string[],
  imageUrl?: string ) => {

  // Process tags - find existing or create new
  const tagConnections = tags.map(tagName => ({
    where: { name: tagName },
    create: { name: tagName },
  }));

  return await prisma.template.create({
    data: {
      title,
      description,
      topic,
      imageUrl,
      isPublic,
      access,
      authorId,
      questions: {
        create: questions.map((q, index) => ({
          ...q,
          order: index,
          options: q.options || [],
        })),
      },
      tags: {
        connectOrCreate: tagConnections,
      },
      allowedUsers: allowedUserIds ? {
        connect: allowedUserIds.map(id => ({ id })),
      } : undefined,
    },
    include: {
      questions: true,
      tags: true,
      allowedUsers: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

const getTemplateById = async (id: string, userId?: string) => {
  const template = await prisma.template.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      questions: {
        orderBy: {
          order: 'asc',
        },
      },
      tags: true,
      allowedUsers: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          forms: true,
          likes: true,
        },
      },
    },
  });

  if (!template) return null;

  // Check if user has access to the template
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return template;

    const hasAccess =
      template.isPublic ||
      template.authorId === userId ||
      template.allowedUsers.some(u => u.id === userId) ||
      user.role === 'ADMIN';

    if (!hasAccess) {
      throw new Error('You do not have access to this template');
    }
  }

  return template;
};

const updateTemplate = async (
  id: string,
  userId: string,
  data: {
    title?: string;
    description?: string;
    topic?: string;
    isPublic?: boolean;
    access?: TemplateAccess;
    questions?: {
      id?: string;
      title: string;
      description: string;
      type: QuestionType;
      isRequired: boolean;
      showInTable: boolean;
      options?: string[];
    }[];
    tags?: string[];
    allowedUserIds?: string[];
  },
  imageUrl?: string
) => {
  const template = await prisma.template.findUnique({
    where: { id },
    include: {
      author: true,
    },
  });

  if (!template) throw new Error('Template not found');


  // Check if user is admin or template author
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  if (user.role !== 'ADMIN' && template.authorId !== userId) {
    throw new Error('You are not authorized to update this template');
  }

  // Handle tags update
  let tagConnections;
  if (data.tags) {
    // First, disconnect all tags
    await prisma.template.update({
      where: { id },
      data: {
        tags: {
          set: [],
        },
      },
    });

    // Then connect or create new tags
    tagConnections = data.tags.map(tagName => ({
      where: { name: tagName },
      create: { name: tagName },
    }));
  }

  // Handle questions update
  let questionsUpdate;
  if (data.questions) {
    // First, delete all existing questions
    await prisma.question.deleteMany({
      where: { templateId: id },
    });

    // Then create new questions
    questionsUpdate = {
      create: data.questions.map((q, index) => ({
        ...q,
        order: index,
        options: q.options || [],
      })),
    };
  }

  // Handle allowed users update
  let allowedUsersUpdate;
  if (data.allowedUserIds) {
    // First, disconnect all allowed users
    await prisma.template.update({
      where: { id },
      data: {
        allowedUsers: {
          set: [],
        },
      },
    });

    // Then connect new allowed users
    allowedUsersUpdate = {
      connect: data.allowedUserIds.map(id => ({ id })),
    };
  }

  return await prisma.template.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      topic: data.topic,
      isPublic: data.isPublic,
      access: data.access,
      imageUrl: imageUrl || template.imageUrl,
      tags: tagConnections ? {
        connectOrCreate: tagConnections,
      } : undefined,
      questions: questionsUpdate,
      allowedUsers: allowedUsersUpdate,
    },
    include: {
      questions: true,
      tags: true,
      allowedUsers: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

const deleteTemplate = async (id: string, userId: string) => {
  const template = await prisma.template.findUnique({
    where: { id },
    include: {
      author: true,
    },
  });

  if (!template) throw new Error('Template not found');

  // Check if user is admin or template author
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  if (user.role !== 'ADMIN' && template.authorId !== userId) {
    throw new Error('You are not authorized to delete this template');
  }

  // Delete template image from Cloudinary if exists
  if (template.imageUrl) {
    const publicId = template.imageUrl.split('/').pop()?.split('.')[0];
    if (publicId) {
      await cloudinary.v2.uploader.destroy(`forms/templates/${publicId}`);
    }
  }

  return await prisma.template.delete({
    where: { id },
  });
};

const searchTemplates = async (query: string, userId?: string, page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;

  const whereClause: Prisma.TemplateWhereInput = {
    OR: [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { tags: { some: { name: { contains: query, mode: 'insensitive' } } } },
      { questions: { some: { title: { contains: query, mode: 'insensitive' } } } },
      { questions: { some: { description: { contains: query, mode: 'insensitive' } } } }
    ],
    AND: userId
      ? [
          {
            OR: [
              { isPublic: true },
              { authorId: userId },
              { allowedUsers: { some: { id: userId } } }
            ]
          }
        ]
      : { isPublic: true }
  };

  const [templates, total] = await Promise.all([
    prisma.template.findMany({
      where: whereClause,
      skip,
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        tags: true,
        _count: {
          select: {
            forms: true,
            likes: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    }),
    prisma.template.count({ where: whereClause })
  ]);

  return {
    templates,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
};

const getPopularTemplates = async (limit: number = 5) => {
  return await prisma.template.findMany({
    take: limit,
    orderBy: {
      forms: {
        _count: 'desc',
      },
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          forms: true,
          likes: true,
        },
      },
    },
  });
};

const getLatestTemplates = async (limit: number = 10) => {
  return await prisma.template.findMany({
    where: {
      isPublic: true,
    },
    take: limit,
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          forms: true,
          likes: true,
        },
      },
    },
  });
};

const getTemplatesByTag = async (tagName: string, userId?: string, page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;

  const whereClause = {
    tags: { some: { name: tagName } },
    AND: userId
      ? [
          {
            OR: [
              { isPublic: true },
              { authorId: userId },
              { allowedUsers: { some: { id: userId } } },
            ],
          },
        ]
      : [{ isPublic: true }],
  };

  const [templates, total] = await Promise.all([
    prisma.template.findMany({
      where: whereClause,
      skip,
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tags: true,
        _count: {
          select: {
            forms: true,
            likes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.template.count({ where: whereClause }),
  ]);

  return {
    templates,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

const getUserTemplates = async (userId: string, page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;

  const [templates, total] = await Promise.all([
    prisma.template.findMany({
      where: {
        authorId: userId,
      },
      skip,
      take: limit,
      include: {
        _count: {
          select: {
            forms: true,
            likes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.template.count({
      where: {
        authorId: userId,
      },
    }),
  ]);

  return {
    templates,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

const getTemplateForms = async (templateId: string, userId: string, page: number = 1, limit: number = 10) => {
  const template = await prisma.template.findUnique({
    where: { id: templateId },
  });

  if (!template) throw new Error('Template not found');

  // Check if user is admin or template author
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  if (user.role !== 'ADMIN' && template.authorId !== userId) {
    throw new Error('You are not authorized to view these forms');
  }

  const skip = (page - 1) * limit;

  const [forms, total] = await Promise.all([
    prisma.form.findMany({
      where: {
        templateId,
      },
      skip,
      take: limit,
      include: {
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
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.form.count({
      where: {
        templateId,
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

const getTemplateStats = async (templateId: string, userId: string) => {
  const template = await prisma.template.findUnique({
    where: { id: templateId },
    include: {
      questions: true,
    },
  });

  if (!template) throw new Error('Template not found');

  // Check if user is admin or template author
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  if (user.role !== 'ADMIN' && template.authorId !== userId) {
    throw new Error('You are not authorized to view these stats');
  }

  const formsCount = await prisma.form.count({
    where: {
      templateId,
    },
  });

  const likesCount = await prisma.like.count({
    where: {
      templateId,
    },
  });

  // Get stats for each question
  const questionsStats = await Promise.all(
    template.questions.map(async question => {
      if (question.type === 'INTEGER') {
        const stats = await prisma.answer.aggregate({
          where: {
            questionId: question.id,
            integerValue: { not: null },  // Fixed field name
          },
          _avg: {
            integerValue: true,  // Fixed field name
          },
          _min: {
            integerValue: true,  // Fixed field name
          },
          _max: {
            integerValue: true,  // Fixed field name
          },
          _count: {
            integerValue: true,  // Fixed field name
          },
        });

        return {
          questionId: question.id,
          questionTitle: question.title,
          type: question.type,
          stats: {
            average: stats._avg.integerValue,  // Fixed field name
            min: stats._min.integerValue,      // Fixed field name
            max: stats._max.integerValue,      // Fixed field name
            count: stats._count.integerValue,  // Fixed field name
          },
        };
      } else if (question.type === 'CHECKBOX') {
        // ... rest of your CHECKBOX logic
      } else if (question.type === 'SINGLE_CHOICE') {
        // ... rest of your SINGLE_CHOICE logic
      } else {
        // ... rest of your text question logic
      }
    })
  );

  return {
    formsCount,
    likesCount,
    questionsStats,
  };
};
const addComment = async (templateId: string, userId: string, content: string) => {
  return await prisma.comment.create({
    data: {
      content,
      templateId,
      userId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

const getComments = async (templateId: string, page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where: {
        templateId,
      },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    }),
    prisma.comment.count({
      where: {
        templateId,
      },
    }),
  ]);

  return {
    comments,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

const likeTemplate = async (templateId: string, userId: string) => {
  // Check if user already liked the template
  const existingLike = await prisma.like.findUnique({
    where: {
      userId_templateId: {
        userId,
        templateId,
      },
    },
  });

  if (existingLike) {
    throw new Error('You already liked this template');
  }

  return await prisma.like.create({
    data: {
      templateId,
      userId,
    },
  });
};

const unlikeTemplate = async (templateId: string, userId: string) => {
  const existingLike = await prisma.like.findUnique({
    where: {
      userId_templateId: {
        userId,
        templateId
      }
    }
  });
  
  if (!existingLike) {
    return null; // or throw a more specific error
  }
  
  return await prisma.like.delete({
    where: {
      userId_templateId: {
        userId,
        templateId
      }
    }
  });
};

const checkUserLike = async (templateId: string, userId: string) => {
  return await prisma.like.findUnique({
    where: {
      userId_templateId: {
        userId,
        templateId,
      },
    },
  });
};
const getPopularTags = async (limit: number = 50): Promise<{ id: string; name: string; count: number }[]> => {
  try {
    const tags = await prisma.tag.findMany({
      take: limit,
      orderBy: {
        templates: {
          _count: 'desc',
        },
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            templates: true,
          },
        },
      },
    });

    return tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      count: tag._count.templates,
    }));
  } catch (error) {
    console.error('Error fetching popular tags:', error);
    throw error;
  }
};

export default {
  createTemplate,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  searchTemplates,
  getPopularTemplates,
  getLatestTemplates,
  getTemplatesByTag,
  getUserTemplates,
  getTemplateForms,
  getTemplateStats,
  addComment,
  getComments,
  likeTemplate,
  unlikeTemplate,
  checkUserLike,
  getPopularTags
}; 