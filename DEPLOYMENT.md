# Railway Deployment Guide

Complete step-by-step guide to deploy both frontend and backend to Railway.

## Prerequisites

- Railway account (sign up at https://railway.app)
- Railway CLI installed: `npm install -g @railway/cli`
- Git repository (optional but recommended)

## Architecture Overview

You'll deploy two separate Railway services:
1. **Backend API**: NestJS app at `api.turbovits.ahmedammar.dev`
2. **Frontend**: Angular app at `turbovets.ahmedammar.dev`

Both will connect to your existing PostgreSQL database at `ju0a.your-database.de`.

## Part 1: Deploy Backend API

### Step 1: Login to Railway

```bash
railway login
```

This will open a browser window for authentication.

### Step 2: Navigate to Backend Directory

```bash
cd apps/api
```

### Step 3: Create New Railway Project

```bash
railway init
```

Select:
- "Create a new project" or select existing project
- Give it a name like "task-management-api"

### Step 4: Set Environment Variables

```bash
# Database Configuration
railway variables set DB_HOST=ju0a.your-database.de
railway variables set DB_PORT=5432
railway variables set DB_USERNAME=turbovets
railway variables set DB_PASSWORD=m3bGES_baQPht
railway variables set DB_NAME=turbovets

# JWT Configuration
railway variables set JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-12345
railway variables set JWT_EXPIRES_IN=24h

# Application Configuration
railway variables set PORT=3000
railway variables set NODE_ENV=production

# CORS Origins (will update after frontend deployment)
railway variables set CORS_ORIGINS=https://turbovets.ahmedammar.dev
```

### Step 5: Deploy Backend

```bash
railway up
```

Railway will:
- Detect the Dockerfile
- Build your Docker image
- Deploy the container
- Provide a URL

### Step 6: Add Custom Domain

1. Go to Railway dashboard: https://railway.app/dashboard
2. Select your project → api service
3. Click "Settings" → "Networking"
4. Click "Add Domain"
5. Select "Custom Domain"
6. Enter: `api.turbovits.ahmedammar.dev`
7. Add the CNAME record to your DNS:
   ```
   Type: CNAME
   Name: api.turbovits
   Value: [Railway provides this]
   ```

### Step 7: Verify Backend Deployment

```bash
# Test health check
curl https://api.turbovits.ahmedammar.dev/api

# Test organizations endpoint
curl https://api.turbovits.ahmedammar.dev/api/organizations
```

## Part 2: Deploy Frontend

### Step 1: Navigate to Frontend Directory

```bash
cd ../dashboard
```

### Step 2: Verify Environment Configuration

Check that `src/environments/environment.prod.ts` has:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.turbovits.ahmedammar.dev/api'
};
```

### Step 3: Create New Railway Service

```bash
railway init
```

- Use the SAME project as the backend
- This creates a new service within the project
- Name it something like "task-management-frontend"

### Step 4: Deploy Frontend

```bash
railway up
```

Railway will:
- Detect the Dockerfile
- Build the Angular app
- Create nginx container
- Deploy

### Step 5: Add Custom Domain

1. Go to Railway dashboard
2. Select your project → frontend service
3. Click "Settings" → "Networking"
4. Click "Add Domain"
5. Select "Custom Domain"
6. Enter: `turbovets.ahmedammar.dev`
7. Add the CNAME record to your DNS:
   ```
   Type: CNAME
   Name: turbovets
   Value: [Railway provides this]
   ```

### Step 6: Verify Frontend Deployment

1. Visit https://turbovets.ahmedammar.dev
2. You should see the login page
3. Check browser console for any CORS errors

## Part 3: Post-Deployment Configuration

### Update CORS Origins

Now that both apps are deployed, update the backend CORS settings:

```bash
cd apps/api

railway variables set CORS_ORIGINS=https://turbovets.ahmedammar.dev,http://localhost:4200
```

Then redeploy:

```bash
railway up
```

### Initialize Database

The database tables will be created automatically on first request thanks to TypeORM's `synchronize: true` setting.

**For production**, it's recommended to:
1. Disable `synchronize` in production
2. Use migrations instead

To disable auto-sync:

```bash
railway variables set NODE_ENV=production
```

And update `apps/api/src/app.module.ts` to set `synchronize: false` in production.

### Create Initial Organization

```bash
curl -X POST https://api.turbovits.ahmedammar.dev/api/organizations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Main Organization",
    "description": "Primary organization"
  }'
```

Save the organization ID for user registration.

## Part 4: Testing the Deployment

### 1. Test Backend Health

```bash
curl https://api.turbovits.ahmedammar.dev/api
```

### 2. Test Organization Endpoint

```bash
curl https://api.turbovits.ahmedammar.dev/api/organizations
```

### 3. Test Frontend

1. Visit https://turbovets.ahmedammar.dev
2. Click "Register here"
3. Create a new account using the organization ID
4. Login and test the dashboard

### 4. Test Full Flow

1. Register a new user
2. Login
3. Create a task
4. Drag task to different column
5. Edit task
6. Delete task
7. Check audit logs (Owner/Admin only)

## Environment Variables Reference

### Backend (API)

| Variable | Value | Description |
|----------|-------|-------------|
| DB_HOST | ju0a.your-database.de | PostgreSQL host |
| DB_PORT | 5432 | PostgreSQL port |
| DB_USERNAME | turbovets | Database username |
| DB_PASSWORD | m3bGES_baQPht | Database password |
| DB_NAME | turbovets | Database name |
| JWT_SECRET | your-secret-key | JWT signing secret |
| JWT_EXPIRES_IN | 24h | Token expiration |
| PORT | 3000 | Application port |
| NODE_ENV | production | Environment |
| CORS_ORIGINS | https://turbovets.ahmedammar.dev | Allowed origins |

### Frontend

No environment variables needed - configuration is baked into the build.

## Monitoring and Logs

### View Backend Logs

```bash
cd apps/api
railway logs
```

### View Frontend Logs

```bash
cd apps/dashboard
railway logs
```

### Railway Dashboard

Visit https://railway.app/dashboard to:
- Monitor resource usage
- View deployment history
- Check service health
- Manage environment variables
- View metrics

## Troubleshooting

### Backend Issues

#### Database Connection Errors

```bash
# Test database connectivity
psql -h ju0a.your-database.de -U turbovets -d turbovets

# Check Railway logs
railway logs

# Verify environment variables
railway variables
```

#### CORS Errors

Make sure CORS_ORIGINS includes your frontend domain:

```bash
railway variables set CORS_ORIGINS=https://turbovets.ahmedammar.dev
railway up
```

### Frontend Issues

#### 404 on Refresh

This is normal for SPAs. The nginx.conf handles it with:
```nginx
try_files $uri $uri/ /index.html;
```

#### Can't Connect to API

1. Check that `environment.prod.ts` has correct API URL
2. Check browser console for CORS errors
3. Verify backend is running: `curl https://api.turbovits.ahmedammar.dev/api`

### DNS Issues

#### Domain Not Resolving

1. Check DNS propagation: `nslookup api.turbovits.ahmedammar.dev`
2. Wait for DNS propagation (can take up to 48 hours)
3. Try using Railway's provided URL first

#### SSL Certificate Errors

Railway automatically provisions SSL certificates. If you see errors:
1. Wait a few minutes for cert provisioning
2. Clear browser cache
3. Check Railway dashboard for cert status

## Scaling Considerations

### Database

The current setup uses an external PostgreSQL database. For production:

1. **Connection Pooling**: Add `pgbouncer` or use Railway's built-in pooling
2. **Backups**: Set up automated backups
3. **Indexes**: Add indexes for frequently queried fields

### Application

Railway auto-scales, but you can configure:

```bash
# Set minimum instances
railway config set MIN_INSTANCES=2

# Set memory limits
railway config set MEMORY_LIMIT=2GB
```

### Caching

For better performance:

1. Add Redis for session storage
2. Implement API response caching
3. Use CDN for static assets

## Security Checklist

- [x] Environment variables set correctly
- [x] JWT_SECRET is strong and unique
- [x] CORS origins restricted to your domain
- [x] Database credentials secured
- [x] HTTPS enabled (automatic with Railway)
- [x] Password hashing with bcrypt
- [ ] Rate limiting (optional, add if needed)
- [ ] Security headers (add helmet.js if needed)

## Cost Optimization

Railway pricing is based on usage. To optimize:

1. **Use Starter Plan**: $5/month for hobby projects
2. **Monitor Resources**: Check dashboard for usage
3. **Optimize Database**: Use connection pooling
4. **Cache Responses**: Reduce database queries
5. **Compress Assets**: Frontend build is already optimized

## Backup and Recovery

### Database Backup

```bash
# Backup database
pg_dump -h ju0a.your-database.de -U turbovets -d turbovets > backup.sql

# Restore database
psql -h ju0a.your-database.de -U turbovets -d turbovets < backup.sql
```

### Application Backup

Your code is in Git, so you can always redeploy:

```bash
railway up
```

## Updating the Application

### Backend Updates

```bash
cd apps/api
# Make your changes
git commit -am "Update backend"
railway up
```

### Frontend Updates

```bash
cd apps/dashboard
# Make your changes
git commit -am "Update frontend"
railway up
```

### Rolling Back

```bash
# View deployment history
railway status

# Rollback to previous deployment
railway rollback [deployment-id]
```

## Production Best Practices

1. **Disable Synchronize**: Set `synchronize: false` in production
2. **Use Migrations**: Create and run TypeORM migrations
3. **Enable Logging**: Set up proper logging (winston, pino)
4. **Add Monitoring**: Use Railway metrics or external APM
5. **Set up Alerts**: Configure Railway to alert on errors
6. **Regular Backups**: Automate database backups
7. **Security Scanning**: Regularly update dependencies
8. **Performance Testing**: Load test before production

## Need Help?

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Project README: [README.md](./README.md)
- Quick Start: [QUICKSTART.md](./QUICKSTART.md)

---

**Deployment Complete!** 🚀

Your application is now live at:
- Frontend: https://turbovets.ahmedammar.dev
- Backend: https://api.turbovits.ahmedammar.dev/api
