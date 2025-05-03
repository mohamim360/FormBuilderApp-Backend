import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { PrismaClient, UserRole } from '@prisma/client';
import config from '../config/config';
import { JwtPayload } from '../types';

const prisma = new PrismaClient();

const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 10);
};

const comparePasswords = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

const generateToken = (userId: string, role: UserRole): string => {
  if (!config.jwt.secret) {
    throw new Error('JWT secret not configured');
  }

  return jwt.sign(
    { userId, role },
    config.jwt.secret,
    { expiresIn: config.jwt.expire } as SignOptions
  );
};

const verifyToken = (token: string): JwtPayload => {
  if (!config.jwt.secret) {
    throw new Error('JWT secret not configured');
  }
  
  return jwt.verify(token, config.jwt.secret) as JwtPayload;
};

export default {
  hashPassword,
  comparePasswords,
  generateToken,
  verifyToken,
};