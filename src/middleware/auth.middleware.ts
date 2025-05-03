import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import { JwtPayload } from '../types';

const authMiddleware =async (req: Request, res: Response, next: NextFunction): Promise<void> =>  {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
     res.status(401).json({ message: 'No token, authorization denied' });
     return;
  }

  try {
    const decoded = authService.verifyToken(token);
    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const adminMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> =>  {
  const user = (req as any).user as JwtPayload;

  if (!user || user.role !== 'ADMIN') {
     res.status(403).json({ message: 'Admin access required' });
  }

  next();
};

export { authMiddleware, adminMiddleware };