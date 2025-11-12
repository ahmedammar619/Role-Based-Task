# Quick Start Guide

This guide will help you get the application running in 5 minutes.

## Prerequisites Check

```bash
node --version  # Should be 20.x or higher
npm --version   # Should be 10.x or higher
```

## Step 1: Install Dependencies

```bash
# Backend
cd apps/api
npm install

# Frontend
cd ../dashboard
npm install
```

## Step 2: Configure Environment

The `.env` file already exists in `apps/api/.env` with your database credentials:

```env
DB_HOST=ju0a.your-database.de
DB_PORT=5432
DB_USERNAME=turbovets
DB_PASSWORD=m3bGES_baQPht
DB_NAME=turbovets
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-12345
PORT=3000
NODE_ENV=development
CORS_ORIGINS=http://localhost:4200,https://turbovets.ahmedammar.dev
```

## Step 3: Start the Application

### Option A: From Root Directory (Recommended)

```bash
# Terminal 1 - Start Backend
npm run api:dev

# Terminal 2 - Start Frontend
npm run dashboard:dev
```

### Option B: Start Separately

```bash
# Terminal 1 - Backend
cd apps/api
npm run start:dev

# Terminal 2 - Frontend
cd apps/dashboard
npm start
```

## Step 4: Access the Application

Open your browser and navigate to:
- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:3000/api

## Step 5: Create Your First Organization

Before you can register users, you need to create an organization:

```bash
curl -X POST http://localhost:3000/api/organizations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Company",
    "description": "Main organization"
  }'
```

**Copy the `id` from the response** - you'll need it for registration!

## Step 6: Register Your First User

1. Go to http://localhost:4200
2. Click "Register here"
3. Fill in the form:
   - Username: your choice
   - Password: at least 6 characters
   - Confirm Password: same as password
   - Role: Select "Owner" for full access
   - Organization: Paste the organization ID from Step 5
4. Click "Register"

## Step 7: Start Using the Dashboard

After registration, you'll be automatically logged in and redirected to the dashboard where you can:
- ✅ Create tasks
- ✅ Drag and drop tasks between columns
- ✅ Filter and search tasks
- ✅ Toggle dark mode
- ✅ View audit logs (Owner/Admin only)

## Common Commands

### Development

```bash
# Start backend
npm run api:dev

# Start frontend
npm run dashboard:dev

# Run tests
cd apps/api && npm test
cd apps/dashboard && npm test
```

### Production Build

```bash
# Build backend
cd apps/api
npm run build

# Build frontend
cd apps/dashboard
npm run build
```

## Troubleshooting

### Backend won't start

1. Check database connection:
   ```bash
   # Make sure the credentials in apps/api/.env are correct
   ```

2. Check if port 3000 is available:
   ```bash
   lsof -i :3000
   # If something is running, kill it or change PORT in .env
   ```

### Frontend won't start

1. Check if port 4200 is available:
   ```bash
   lsof -i :4200
   ```

2. Clear Angular cache:
   ```bash
   cd apps/dashboard
   rm -rf .angular node_modules
   npm install
   ```

### Database connection issues

1. Verify the database is accessible:
   ```bash
   psql -h ju0a.your-database.de -U turbovets -d turbovets
   ```

2. Check firewall settings - make sure your IP can access the database

### Can't register users

1. Make sure you created an organization first (Step 5)
2. Use the organization ID (UUID) in the registration form
3. Check browser console for error messages

## Next Steps

1. **Create more organizations** for testing multi-tenant features
2. **Create users with different roles** (Owner, Admin, Viewer) to test RBAC
3. **Create tasks** and test the drag-and-drop functionality
4. **Test filtering and search** features
5. **View audit logs** to see all tracked actions

## Quick Test Scenario

```bash
# 1. Create parent organization
curl -X POST http://localhost:3000/api/organizations \
  -H "Content-Type: application/json" \
  -d '{"name": "Parent Corp", "description": "Main company"}'
# Save the ID as PARENT_ID

# 2. Create child organization
curl -X POST http://localhost:3000/api/organizations \
  -H "Content-Type: application/json" \
  -d '{"name": "Child Corp", "description": "Subsidiary", "parentId": "PARENT_ID"}'
# Save the ID as CHILD_ID

# Now register users in both organizations and test that:
# - Owners in Parent Corp can see tasks from Child Corp
# - Users in Child Corp can only see their own tasks
```

## Support

If you encounter any issues:
1. Check the comprehensive [README.md](./README.md)
2. Review the API documentation
3. Check the browser console and server logs for errors

## Production Deployment

For Railway deployment, see [README.md - Railway Deployment](./README.md#railway-deployment)
