# Dashboard Integration Guide

Quick guide to integrate the Dashboard component into your Angular application.

## Step 1: Update Routes

Add the dashboard route to your `app.routes.ts`:

```typescript
import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard]
  }
];
```

## Step 2: Update App Config (if needed)

Ensure your `app.config.ts` includes the necessary providers:

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};
```

## Step 3: Verify Environment Configuration

Check your `environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api' // Your API URL
};
```

## Step 4: Test the Integration

1. **Start your backend API** (if not already running)
   ```bash
   npm run start:api
   ```

2. **Start the Angular development server**
   ```bash
   npm run start
   ```

3. **Navigate to the dashboard**
   - Login with valid credentials
   - You should be redirected to `/dashboard`
   - The dashboard should load and display tasks

## Step 5: Verify Functionality

Test the following features:

### Authentication & Authorization
- [ ] Dashboard requires login (redirects to /login if not authenticated)
- [ ] User info displayed in header
- [ ] Role badge shows correct role (OWNER/ADMIN/VIEWER)
- [ ] Logout button works and redirects to login

### Task Management
- [ ] Tasks load from API
- [ ] Create button visible for OWNER/ADMIN (hidden for VIEWER)
- [ ] Create modal opens and creates tasks
- [ ] Edit button visible for OWNER/ADMIN (hidden for VIEWER)
- [ ] Edit modal updates tasks
- [ ] Delete button visible for OWNER/ADMIN (hidden for VIEWER)
- [ ] Delete confirmation modal works

### Drag & Drop
- [ ] Can drag tasks between columns (if OWNER/ADMIN)
- [ ] Task status updates on backend when moved
- [ ] Cannot drag if VIEWER role

### Filtering & Search
- [ ] Category filter works (All, Work, Personal, Urgent, Other)
- [ ] Search filters by title/description in real-time
- [ ] Sort by date/title/priority works

### Statistics
- [ ] Total tasks count correct
- [ ] TODO count correct
- [ ] IN PROGRESS count correct
- [ ] DONE count correct
- [ ] Completion percentage calculated correctly

### Dark Mode
- [ ] Dark mode toggle works
- [ ] Preference persists across page refreshes
- [ ] All UI elements adapt to dark mode

### Responsive Design
- [ ] Desktop view (3 columns side by side)
- [ ] Tablet view (2 columns or 1 column)
- [ ] Mobile view (1 column stacked)
- [ ] All buttons accessible on mobile

### Error Handling
- [ ] Loading spinner shows during API calls
- [ ] Error messages display for failed operations
- [ ] Error messages auto-dismiss after 3 seconds

## Common Issues & Solutions

### Issue: Dashboard route not loading
**Solution**: Check that the component is imported correctly and the route is defined in app.routes.ts

### Issue: Tasks not loading
**Solutions**:
1. Check API URL in environment.ts
2. Verify backend is running
3. Check browser console for API errors
4. Verify JWT token is being sent (check Network tab)

### Issue: Cannot create/edit/delete tasks
**Solutions**:
1. Check user role (must be OWNER or ADMIN)
2. Verify API permissions
3. Check browser console for errors

### Issue: Dark mode not working
**Solution**: Ensure TailwindCSS dark mode is configured in tailwind.config.js:
```javascript
module.exports = {
  darkMode: 'class', // or 'media'
  // ... rest of config
}
```

### Issue: Drag & drop not working
**Solutions**:
1. Verify @angular/cdk is installed: `npm install @angular/cdk`
2. Check that DragDropModule is imported in component
3. Ensure user has edit permissions (OWNER/ADMIN)

### Issue: Styles not applied
**Solutions**:
1. Verify TailwindCSS is configured correctly
2. Check that component CSS files are linked
3. Clear browser cache and rebuild

## API Endpoints Used

The dashboard component calls these API endpoints:

- `GET /api/tasks` - Fetch all tasks
- `POST /api/tasks` - Create new task
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

Ensure these endpoints are implemented in your backend.

## Role-Based Access Control

### OWNER Role
- Can create tasks
- Can edit all tasks
- Can delete all tasks
- Can drag & drop tasks

### ADMIN Role
- Can create tasks
- Can edit all tasks
- Can delete all tasks
- Can drag & drop tasks

### VIEWER Role
- Can only view tasks
- Cannot create tasks
- Cannot edit tasks
- Cannot delete tasks
- Cannot drag & drop tasks

## Navigation Flow

```
Login Page (/login)
    |
    | (successful login)
    v
Dashboard (/dashboard)
    |
    | (logout)
    v
Login Page (/login)
```

## Customization Options

### Change Color Scheme
Edit the category colors in `dashboard.component.ts`:
```typescript
getCategoryColor(category: TaskCategory): string {
  const colors: Record<TaskCategory, string> = {
    [TaskCategory.WORK]: 'bg-blue-100 text-blue-800', // Change these
    [TaskCategory.PERSONAL]: 'bg-green-100 text-green-800',
    [TaskCategory.URGENT]: 'bg-red-100 text-red-800',
    [TaskCategory.OTHER]: 'bg-gray-100 text-gray-800'
  };
  return colors[category];
}
```

### Add Custom Filters
Extend the `categoryOptions` array and update `filterAndSearchTasks()` method.

### Modify Sort Options
Update the `sortTasks()` method to add custom sorting logic.

### Add Pagination
Implement pagination by modifying `organizeTasks()` to slice the array based on page number.

## Performance Tips

1. **Enable OnPush Change Detection**
   ```typescript
   @Component({
     selector: 'app-dashboard',
     changeDetection: ChangeDetectionStrategy.OnPush,
     // ...
   })
   ```

2. **Lazy Load the Dashboard**
   ```typescript
   {
     path: 'dashboard',
     loadComponent: () => import('./components/dashboard/dashboard.component')
       .then(m => m.DashboardComponent),
     canActivate: [AuthGuard]
   }
   ```

3. **Add Virtual Scrolling** for large task lists using `@angular/cdk/scrolling`

## Support

For issues or questions:
1. Check the browser console for errors
2. Review the API response in Network tab
3. Verify user permissions and role
4. Check the README.md for component documentation
