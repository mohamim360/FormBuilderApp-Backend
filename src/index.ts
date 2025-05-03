import express from 'express';
import cors from 'cors';

import { PrismaClient } from '@prisma/client';
;
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import templateRoutes from './routes/template.routes';
import formRoutes from './routes/form.routes';

import errorHandler from './middleware/error.middleware';
import notFoundHandler from './middleware/notFound.middleware';
import config from './config/config';

const prisma = new PrismaClient();

const app = express();

// Middleware

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/forms', formRoutes);

// Error handling
app.use(errorHandler);
app.use(notFoundHandler);

// Start server
const PORT = config.port || 5000;

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

startServer();

// Handle shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});