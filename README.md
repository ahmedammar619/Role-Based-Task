# Secure Task Management System

A full-stack task management app with JWT authentication and role-based access control. Built with Angular, NestJS, TypeORM, and PostgreSQL.

## Quick Start

**Run everything with one command:**

```bash
docker-compose up --build
```

Just make sure you've filled in `apps/api/.env` first (see Setup below).

Access the app at:
- Frontend: http://localhost:4200
- Backend API: http://localhost:3000/api

## Setup Instructions

### 1. Configure Environment Variables

**Backend** (`apps/api/.env`):
```bash
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your database credentials and JWT secret
```

**Frontend** (`apps/dashboard/.env`):
```bash
cp apps/dashboard/.env.example apps/dashboard/.env
# Default is already set to http://localhost:3000/api
```

### 2. Run Locally (Without Docker)

```bash
# Install dependencies
npm install

# Terminal 1 - Backend
cd apps/api
npm install
npm run start:dev

# Terminal 2 - Frontend
cd apps/dashboard
npm install
npm start
```

### 3. Create Your First Organization

```bash
curl -X POST http://localhost:3000/api/organizations \
  -H "Content-Type: application/json" \
  -d '{"name": "My Company", "description": "Main org"}'
```

Save the returned `id` - you'll need it when registering users.

## Architecture Overview

**Monorepo Structure:**
```
apps/
├── api/              # NestJS backend (JWT auth, RBAC, TypeORM)
└── dashboard/        # Angular frontend (TailwindCSS, drag-drop)
```

**Why this structure?**
- Clean separation of concerns
- Shared types could go in `libs/` if needed
- Easy deployment: each app has its own Dockerfile

## Data Model

**Users** → belong to Organizations, have Roles (Owner/Admin/Viewer)

**Organizations** → 2-level hierarchy (parent/child), data isolation

**Tasks** → have title, status, category, assigned user, belongs to organization

**Audit Logs** → track all actions (create, update, delete, login)

**Relationships:**
- User ↔ Organization (many-to-one)
- Task ↔ User (created by, assigned to)
- Task ↔ Organization (belongs to)
- Audit Log ↔ User (action performed by)

## Access Control Implementation

**Role Hierarchy:**
- **Owner**: Full access to everything including child organizations
- **Admin**: Create/edit/delete own tasks, view all org tasks
- **Viewer**: Read-only access to org tasks

**How it works:**
1. User logs in with username/password
2. Backend validates credentials and returns JWT token
3. JWT contains user ID, role, and organization ID
4. Every request validates JWT and checks permissions using guards
5. Guards use decorators like `@Roles('owner', 'admin')` to restrict access
6. Organization-level filtering ensures users only see their org's data

**JWT Integration:**
- Token generated on login/register
- Expires in 24h (configurable)
- Validated on every API request using JwtAuthGuard
- User info extracted from token and injected into request

## API Documentation

### Authentication

**Register:**
```http
POST /api/auth/register
{
  "username": "johndoe",
  "password": "password123",
  "role": "admin",
  "organizationId": "org-uuid-here"
}

Response:
{
  "access_token": "eyJhbG...",
  "user": { "id": "...", "username": "johndoe", "role": "admin" }
}
```

**Login:**
```http
POST /api/auth/login
{
  "username": "johndoe",
  "password": "password123"
}
```

### Tasks

**Get All Tasks** (scoped to user's role and org):
```http
GET /api/tasks
Authorization: Bearer {token}
```

**Create Task** (Owner/Admin only):
```http
POST /api/tasks
Authorization: Bearer {token}
{
  "title": "Fix bug",
  "description": "Details here",
  "status": "todo",
  "category": "work",
  "assignedToId": "user-uuid"
}
```

**Update Task** (Owner or task owner):
```http
PATCH /api/tasks/:id
Authorization: Bearer {token}
{
  "status": "in_progress"
}
```

**Delete Task** (Owner or task owner):
```http
DELETE /api/tasks/:id
Authorization: Bearer {token}
```

### Audit Logs (Owner/Admin only)

```http
GET /api/audit-log
Authorization: Bearer {token}
```

## Features

**Backend:**
- JWT authentication with password hashing (bcrypt)
- Role-based access control with guards and decorators
- Organization hierarchy (2 levels)
- Task CRUD with permission checks
- Audit logging to database
- TypeORM with PostgreSQL
- CORS protection

**Frontend:**
- Login/Register UI
- Task dashboard with drag-and-drop status changes
- Filter by category (Work, Personal, Urgent, Other)
- Search by title/description
- Sort by date, title, or priority
- Dark mode toggle
- Responsive design (mobile to desktop)
- JWT token storage and automatic header injection

## Testing

**Backend:**
```bash
cd apps/api
npm test              # Jest unit tests
npm run test:e2e     # E2E tests
```

**Frontend:**
```bash
cd apps/dashboard
npm test             # Karma tests
```

## Future Considerations

**Security Improvements:**
- JWT refresh tokens for better security
- Rate limiting on auth endpoints
- RBAC caching to reduce DB queries
- Complete Libs/ with reusable RBAC utils
- Add drag and drop feature to the UI
- Add email/sms notification to user


**Advanced Features:**
- Role delegation (admins creating custom roles)
- Task templates and workflows
- Real-time updates with WebSockets
- File attachments on tasks
- Team collaboration features

**Scaling:**
- Redis for session/cache storage
- Database indexing optimization
- Horizontal scaling with load balancers
- Microservices architecture if needed

## Tech Stack

**Backend:** NestJS, TypeORM, PostgreSQL, Passport-JWT, Bcrypt

**Frontend:** Angular 18, TailwindCSS, Angular CDK, RxJS

**DevOps:** Docker, Docker Compose
