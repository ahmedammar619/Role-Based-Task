# Secure Task Management System

A full-stack task management application with role-based access control (RBAC), built with Angular, NestJS, TypeORM, and PostgreSQL.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Running the Application](#running-the-application)
- [Docker Deployment](#docker-deployment)
- [Railway Deployment](#railway-deployment)
- [API Documentation](#api-documentation)
- [Access Control](#access-control)
- [Testing](#testing)

## Features

### Core Functionality
- ✅ JWT-based authentication with secure token management
- ✅ Role-based access control (RBAC) with 3 roles: Owner, Admin, Viewer
- ✅ Task management with CRUD operations
- ✅ Drag-and-drop task status updates
- ✅ Task filtering by category (Work, Personal, Urgent, Other)
- ✅ Search tasks by title and description
- ✅ Sort tasks by date, title, or priority
- ✅ Multi-organization support with 2-level hierarchy
- ✅ Audit logging for all actions
- ✅ Dark mode support

### Security Features
- ✅ JWT token authentication
- ✅ Password hashing with bcrypt
- ✅ Role-based permission system
- ✅ Organization-level data isolation
- ✅ CORS protection
- ✅ Input validation and sanitization

## Technology Stack

### Backend
- **NestJS** - Progressive Node.js framework
- **TypeORM** - ORM for database operations
- **PostgreSQL** - Primary database
- **Passport-JWT** - JWT authentication
- **Bcrypt** - Password hashing

### Frontend
- **Angular 18+** - Frontend framework
- **TailwindCSS** - Utility-first CSS
- **Angular CDK** - Drag & drop functionality
- **RxJS** - Reactive programming

## Project Structure

```
Role-Based-Task/
├── apps/
│   ├── api/              # NestJS backend
│   │   ├── src/
│   │   │   ├── entities/       # Database models
│   │   │   ├── auth/           # Authentication module
│   │   │   ├── tasks/          # Tasks module
│   │   │   ├── audit/          # Audit logging
│   │   │   └── organizations/  # Organizations module
│   │   ├── Dockerfile
│   │   └── .env.example
│   │
│   └── dashboard/        # Angular frontend
│       ├── src/
│       │   ├── app/
│       │   │   ├── components/
│       │   │   ├── services/
│       │   │   ├── guards/
│       │   │   └── models/
│       │   └── environments/
│       ├── Dockerfile
│       └── nginx.conf
│
└── README.md
```

## Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher
- PostgreSQL 14+ (or external database access)
- Docker (optional)

## Setup Instructions

### 1. Backend Setup

```bash
cd apps/api

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials:
# DB_HOST=ju0a.your-database.de
# DB_PORT=5432
# DB_USERNAME=turbovets
# DB_PASSWORD=m3bGES_baQPht
# DB_NAME=turbovets
```

### 2. Frontend Setup

```bash
cd apps/dashboard

# Install dependencies
npm install

# Environment is pre-configured for:
# - Local: http://localhost:3000/api
# - Production: https://api.turbovits.ahmedammar.dev/api
```

### 3. Database Initialization

The database tables will be created automatically on first run (development mode).

## Running the Application

### Development Mode

```bash
# Terminal 1 - Backend (from root)
npm run api:dev

# Terminal 2 - Frontend (from root)
npm run dashboard:dev
```

Access the app at:
- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:3000/api

### Create Your First Organization

Before registering users, create an organization:

```bash
curl -X POST http://localhost:3000/api/organizations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Company",
    "description": "Main organization"
  }'
```

Save the returned `id` to use when registering users.

## Docker Deployment

### Backend

```bash
cd apps/api

docker build -t task-api .

docker run -p 3000:3000 \
  -e DB_HOST=ju0a.your-database.de \
  -e DB_PORT=5432 \
  -e DB_USERNAME=turbovets \
  -e DB_PASSWORD=m3bGES_baQPht \
  -e DB_NAME=turbovets \
  -e JWT_SECRET=your-secret-key \
  -e CORS_ORIGINS=https://turbovets.ahmedammar.dev \
  task-api
```

### Frontend

```bash
cd apps/dashboard

docker build -t task-dashboard .

docker run -p 80:80 task-dashboard
```

## Railway Deployment

### Backend Deployment

1. **Create Railway Project**
   ```bash
   cd apps/api
   railway login
   railway init
   ```

2. **Set Environment Variables**
   ```bash
   railway variables set DB_HOST=ju0a.your-database.de
   railway variables set DB_PORT=5432
   railway variables set DB_USERNAME=turbovets
   railway variables set DB_PASSWORD=m3bGES_baQPht
   railway variables set DB_NAME=turbovets
   railway variables set JWT_SECRET=your-super-secret-key
   railway variables set NODE_ENV=production
   railway variables set CORS_ORIGINS=https://turbovets.ahmedammar.dev
   railway variables set PORT=3000
   ```

3. **Deploy**
   ```bash
   railway up
   ```

4. **Add Custom Domain**
   - Go to Railway dashboard → Your service → Settings → Networking
   - Add domain: `api.turbovits.ahmedammar.dev`

### Frontend Deployment

1. **Create Railway Project**
   ```bash
   cd apps/dashboard
   railway init
   ```

2. **Deploy**
   ```bash
   railway up
   ```

3. **Add Custom Domain**
   - Go to Railway dashboard → Your service → Settings → Networking
   - Add domain: `turbovets.ahmedammar.dev`

## API Documentation

### Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "password": "password123",
  "role": "admin",
  "organizationId": "org-uuid"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "johndoe",
  "password": "password123"
}
```

### Tasks

#### Get All Tasks
```http
GET /api/tasks
Authorization: Bearer {token}
```

#### Create Task
```http
POST /api/tasks
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Task title",
  "description": "Description",
  "status": "todo",
  "category": "work",
  "dueDate": "2024-12-31"
}
```

#### Update Task
```http
PATCH /api/tasks/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "in_progress"
}
```

#### Delete Task
```http
DELETE /api/tasks/:id
Authorization: Bearer {token}
```

### Audit Logs

```http
GET /api/audit-log
Authorization: Bearer {token}
```

## Access Control

### Roles & Permissions

| Role   | Create Tasks | Edit Tasks | Delete Tasks | View Audit Logs |
|--------|--------------|------------|--------------|-----------------|
| OWNER  | ✅           | ✅         | ✅           | ✅              |
| ADMIN  | ✅           | ✅         | Own tasks    | ✅              |
| VIEWER | ❌           | ❌         | ❌           | ❌              |

### Organization Hierarchy

- 2-level hierarchy support (Parent → Child)
- Owners can see tasks from child organizations
- Admins/Viewers see only their organization's tasks
- Company-level data isolation

### Data Models

#### Users
- `username` (unique)
- `password` (hashed)
- `role` (owner/admin/viewer)
- `organizationId`

#### Organizations
- `name` (unique)
- `description`
- `parentId` (optional, for hierarchy)

#### Tasks
- `title`
- `description`
- `status` (todo/in_progress/done)
- `category` (work/personal/urgent/other)
- `organizationId`
- `createdById`
- `assignedToId`

#### Audit Logs
- `userId`
- `action` (create/read/update/delete/login/logout)
- `resource`
- `details`
- `timestamp`

## Testing

### Backend
```bash
cd apps/api
npm test                 # Unit tests
npm run test:cov        # With coverage
npm run test:e2e        # E2E tests
```

### Frontend
```bash
cd apps/dashboard
npm test                 # Unit tests
npm run test:coverage   # With coverage
```

## Security Best Practices

- ✅ JWT tokens with expiration
- ✅ Password hashing with bcrypt (10 rounds)
- ✅ Input validation with class-validator
- ✅ SQL injection protection via TypeORM
- ✅ CORS configuration
- ✅ Environment variable protection
- ✅ Role-based access control

## License

MIT
