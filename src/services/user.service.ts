import { PrismaClient, UserRole } from '@prisma/client';
import authService from './auth.service';


const prisma = new PrismaClient();

const createUser = async (email: string, name: string, password: string, role: UserRole = 'USER') => {
  const hashedPassword = await authService.hashPassword(password);
  
  return await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });
};

const getUserById = async (id: string) => {
  return await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

const getUserByEmail = async (email: string) => {
  return await prisma.user.findUnique({
    where: { email },
  });
};

const updateUser = async (id: string, data: { name?: string; email?: string; password?: string; role?: UserRole; isActive?: boolean }) => {
  if (data.password) {
    data.password = await authService.hashPassword(data.password);
  }

  return await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};


const deleteUser = async (id: string) => {
  const templates = await prisma.template.findMany({
    where: { authorId: id },
    select: { id: true },
  });

  const templateIds = templates.map(t => t.id);

  // Delete in correct order
  await prisma.answer.deleteMany({
    where: { form: { templateId: { in: templateIds } } },
  });

  await prisma.comment.deleteMany({
    where: { templateId: { in: templateIds } },
  });

  await prisma.like.deleteMany({
    where: { templateId: { in: templateIds } },
  });

  await prisma.form.deleteMany({
    where: { templateId: { in: templateIds } },
  });

  await prisma.question.deleteMany({
    where: { templateId: { in: templateIds } },
  });

  await prisma.template.deleteMany({
    where: { id: { in: templateIds } },
  });

  // Now delete user
  return await prisma.user.delete({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });
};



const getAllUsers = async (page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.user.count(),
  ]);

  return {
    users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
  
};

export default {
  createUser,
  getUserById,
  getUserByEmail,
  updateUser,
  deleteUser,
  getAllUsers,
  
};