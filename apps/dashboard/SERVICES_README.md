# Angular Services, Guards, and Interceptors

This document describes the authentication and task management services created for the dashboard application.

## Created Files

### 1. Auth Service
**Location:** `/Users/ahmedammar/Documents/Role-Based-Task/apps/dashboard/src/app/services/auth.service.ts`

**Features:**
- User authentication (login/register)
- JWT token management with localStorage
- Token expiration validation
- Current user state management using BehaviorSubject
- Comprehensive error handling
- Uses environment.apiUrl for API calls

**Methods:**
- `login(credentials: LoginRequest): Observable<AuthResponse>` - Authenticate user
- `register(data: RegisterRequest): Observable<AuthResponse>` - Register new user
- `logout(): void` - Clear session and logout
- `getCurrentUser(): User | null` - Get current authenticated user
- `isAuthenticated(): boolean` - Check if user is authenticated (includes token expiration check)
- `getToken(): string | null` - Get JWT token from localStorage

**Usage Example:**
```typescript
import { AuthService } from './services/auth.service';

constructor(private authService: AuthService) {}

// Login
this.authService.login({ username: 'user', password: 'pass' })
  .subscribe({
    next: (response) => console.log('Logged in:', response.user),
    error: (error) => console.error('Login failed:', error)
  });

// Check authentication
const isAuth = this.authService.isAuthenticated();

// Subscribe to current user changes
this.authService.currentUser$.subscribe(user => {
  console.log('Current user:', user);
});
```

---

### 2. Task Service
**Location:** `/Users/ahmedammar/Documents/Role-Based-Task/apps/dashboard/src/app/services/task.service.ts`

**Features:**
- Full CRUD operations for tasks
- Automatic JWT token injection in headers
- Comprehensive error handling with specific status code messages
- Uses environment.apiUrl for API calls
- TypeScript types from task.model.ts

**Methods:**
- `getTasks(): Observable<Task[]>` - Get all tasks
- `getTask(id: string): Observable<Task>` - Get single task by ID
- `createTask(task: CreateTaskDto): Observable<Task>` - Create new task
- `updateTask(id: string, task: UpdateTaskDto): Observable<Task>` - Update existing task
- `deleteTask(id: string): Observable<void>` - Delete task

**Usage Example:**
```typescript
import { TaskService } from './services/task.service';
import { CreateTaskDto, TaskStatus, TaskCategory } from './models/task.model';

constructor(private taskService: TaskService) {}

// Get all tasks
this.taskService.getTasks().subscribe({
  next: (tasks) => console.log('Tasks:', tasks),
  error: (error) => console.error('Error:', error)
});

// Create task
const newTask: CreateTaskDto = {
  title: 'New Task',
  description: 'Task description',
  status: TaskStatus.TODO,
  category: TaskCategory.WORK
};

this.taskService.createTask(newTask).subscribe({
  next: (task) => console.log('Created:', task),
  error: (error) => console.error('Error:', error)
});

// Update task
this.taskService.updateTask('task-id', { status: TaskStatus.DONE })
  .subscribe({
    next: (task) => console.log('Updated:', task),
    error: (error) => console.error('Error:', error)
  });
```

---

### 3. Auth Guard
**Location:** `/Users/ahmedammar/Documents/Role-Based-Task/apps/dashboard/src/app/guards/auth.guard.ts`

**Features:**
- Protects routes from unauthorized access
- Redirects to /login if not authenticated
- Stores attempted URL for post-login redirect
- Uses functional guard (CanActivateFn)

**Usage in Routes:**
```typescript
import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./dashboard/dashboard.component')
  },
  {
    path: 'tasks',
    canActivate: [authGuard],
    loadComponent: () => import('./tasks/tasks.component')
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component')
  }
];
```

---

### 4. Auth Interceptor
**Location:** `/Users/ahmedammar/Documents/Role-Based-Task/apps/dashboard/src/app/interceptors/auth.interceptor.ts`

**Features:**
- Automatically adds JWT token to all HTTP requests
- Handles 401 Unauthorized responses
- Auto-logout and redirect on authentication failure
- Uses functional interceptor (HttpInterceptorFn)

**Setup in App Config:**
```typescript
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([authInterceptor])
    )
  ]
};
```

---

## Configuration

### Environment Setup
The services use `environment.apiUrl` from the environment configuration:

**File:** `/Users/ahmedammar/Documents/Role-Based-Task/apps/dashboard/src/environments/environment.ts`
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
```

### LocalStorage Keys
The auth service uses the following localStorage keys:
- `auth_token` - JWT access token
- `current_user` - Serialized user object

---

## Integration Guide

### 1. Update app.config.ts
Add the HTTP interceptor to your application configuration:

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};
```

### 2. Update app.routes.ts
Add auth guard to protected routes:

```typescript
import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./dashboard/dashboard.component')
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component')
  }
];
```

### 3. Use in Components
```typescript
import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { TaskService } from './services/task.service';

@Component({
  selector: 'app-dashboard',
  template: `...`
})
export class DashboardComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private taskService: TaskService
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    console.log('Current user:', user);

    this.taskService.getTasks().subscribe({
      next: (tasks) => console.log('Tasks:', tasks),
      error: (error) => console.error('Error:', error)
    });
  }
}
```

---

## Error Handling

All services include comprehensive error handling:

### Auth Service Errors
- Network errors
- Invalid credentials
- Server errors with status codes
- Token expiration

### Task Service Errors
- 401 Unauthorized - Token expired or invalid
- 403 Forbidden - Insufficient permissions
- 404 Not Found - Task doesn't exist
- Other HTTP errors with descriptive messages

### Automatic Error Recovery
The auth interceptor automatically:
1. Detects 401 responses
2. Logs out the user
3. Redirects to login page
4. Clears stored tokens

---

## Security Features

1. **JWT Token Management**
   - Stored securely in localStorage
   - Token expiration validation
   - Automatic logout on expiration

2. **Request Authentication**
   - Automatic token injection via interceptor
   - Bearer token format
   - Consistent header management

3. **Route Protection**
   - Auth guard prevents unauthorized access
   - Preserves attempted URL for post-login redirect
   - Seamless authentication flow

4. **Error Handling**
   - Automatic session cleanup on auth errors
   - User-friendly error messages
   - Console logging for debugging

---

## Models Used

### User Model (`/Users/ahmedammar/Documents/Role-Based-Task/apps/dashboard/src/app/models/user.model.ts`)
- `User` - User entity
- `UserRole` - Enum (OWNER, ADMIN, VIEWER)
- `LoginRequest` - Login credentials
- `RegisterRequest` - Registration data
- `AuthResponse` - Auth API response

### Task Model (`/Users/ahmedammar/Documents/Role-Based-Task/apps/dashboard/src/app/models/task.model.ts`)
- `Task` - Task entity
- `TaskStatus` - Enum (TODO, IN_PROGRESS, DONE)
- `TaskCategory` - Enum (WORK, PERSONAL, URGENT, OTHER)
- `CreateTaskDto` - Create task payload
- `UpdateTaskDto` - Update task payload

---

## Testing

Example test for Auth Service:
```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should login successfully', () => {
    const mockResponse = {
      access_token: 'token',
      user: { id: '1', username: 'test', role: 'admin' }
    };

    service.login({ username: 'test', password: 'pass' }).subscribe(
      response => expect(response).toEqual(mockResponse)
    );

    const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });
});
```
