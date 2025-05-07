# Form Builder Backend

## Project Overview
This is the backend server for a Form Builder application, built with Node.js, Express, and Prisma. It provides RESTful APIs for user authentication, template creation,Form management and more.

## Live Demo
[Server live link](https://formbuilderapp-backend-6.onrender.com)  
[Client live link](https://form-builder-app-frontend-eta.vercel.app/)

## GitHub Repositories
- Frontend: [https://github.com/mohamim360/FormBuilderApp-Frontend](https://github.com/mohamim360/FormBuilderApp-Frontend)
- Backend: [https://github.com/mohamim360/FormBuilderApp-Backend](https://github.com/mohamim360/FormBuilderApp-Backend)

## Key Features
- User authentication and authorization
- Template creation with multiple question types
- Form submission and response collection
- comments and likes
- Admin dashboard for user management

## Technology Stack

### Backend
- Node.js 18
- Express.js
- Prisma ORM
- PostgreSQL
- JWT authentication
- Cloudinary for image storage
- Full-text search with PostgreSQL

## Database Schema
![ER Diagram](src/uploads/ER.PNG)

## Environment Configuration
Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/formbuilder?schema=public"

# Authentication
JWT_SECRET="your_secure_jwt_secret"
JWT_EXPIRES_IN="7d"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

```


## Project Structure

### Backend
```
prisma/ 
├──schema          # Database
src/
├── controllers/       # Route controllers
├── middleware/        # Custom middleware
├──routes/           # API routes
├── services/         # Business logic
├── utils/            # Helper functions
├── app.ts            # Express app setup
└── server.ts         # Server entry point
```

