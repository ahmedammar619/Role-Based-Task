# Task Management Dashboard Component

A comprehensive, feature-rich task management dashboard built with Angular and TailwindCSS.

## Features

### Core Functionality
- **Drag & Drop**: Three-column Kanban board (TODO, IN PROGRESS, DONE) with Angular CDK drag-drop
- **Task Management**: Create, edit, and delete tasks with a modal form
- **Filtering**: Filter tasks by category (Work, Personal, Urgent, Other)
- **Search**: Real-time search by task title or description
- **Sorting**: Sort tasks by date, title, or priority

### Task Details
Each task displays:
- Title
- Description
- Category badge (color-coded)
- Due date
- Assignee information
- Action buttons (Edit/Delete)

### Visual Features
- **Statistics Cards**: Display counts for total, todo, in-progress, and completed tasks
- **Completion Percentage**: Shows overall task completion rate
- **Dark Mode**: Toggle between light and dark themes (preference saved to localStorage)
- **Responsive Design**: Fully responsive from mobile to desktop
- **Modern UI**: Professional TailwindCSS styling with smooth animations

### User Management
- **User Info Display**: Shows current username and role
- **Role-Based Access Control**:
  - OWNER/ADMIN: Can create, edit, and delete tasks
  - VIEWER: Can only view tasks
- **Logout**: Secure logout functionality

### Error Handling
- Loading states with spinner
- Error messages with auto-dismiss
- Delete confirmation modal
- API error handling

## File Structure

```
dashboard/
├── dashboard.component.ts      # Main component logic
├── dashboard.component.html    # Template with Kanban board
├── dashboard.component.css     # Styles and animations
└── README.md                   # This file

task-form/
├── task-form.component.ts      # Modal form logic
├── task-form.component.html    # Form template
└── task-form.component.css     # Form styles
```

## Usage

### Adding to Routes

```typescript
import { DashboardComponent } from './components/dashboard/dashboard.component';

export const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard]
  }
];
```

### Direct Usage

```html
<app-dashboard></app-dashboard>
```

## Dependencies

- **@angular/core**: ^18+
- **@angular/common**: ^18+
- **@angular/forms**: ^18+ (FormsModule, ReactiveFormsModule)
- **@angular/router**: ^18+
- **@angular/cdk/drag-drop**: ^20+ (DragDropModule)
- **TailwindCSS**: ^4+
- **RxJS**: ^7+

## Services Required

### TaskService
Provides CRUD operations for tasks:
- `getTasks()`: Fetch all tasks
- `createTask(task)`: Create a new task
- `updateTask(id, task)`: Update an existing task
- `deleteTask(id)`: Delete a task

### AuthService
Provides authentication and user management:
- `currentUser$`: Observable of current user
- `getCurrentUser()`: Get current user synchronously
- `logout()`: Logout current user

## Task Model

```typescript
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  category: TaskCategory;
  order: number;
  dueDate?: Date;
  organizationId: string;
  createdById: string;
  assignedToId?: string;
  createdBy?: any;
  assignedTo?: any;
  createdAt: Date;
  updatedAt: Date;
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done'
}

export enum TaskCategory {
  WORK = 'work',
  PERSONAL = 'personal',
  URGENT = 'urgent',
  OTHER = 'other'
}
```

## User Model

```typescript
export interface User {
  id: string;
  username: string;
  role: UserRole;
  organizationId: string;
  organization?: Organization;
}

export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  VIEWER = 'viewer'
}
```

## Component API

### DashboardComponent

#### Inputs
None (standalone component)

#### Outputs
None (uses router for navigation)

#### Public Methods
- `loadTasks()`: Reload tasks from API
- `toggleDarkMode()`: Toggle dark mode
- `logout()`: Logout and navigate to login

#### Role-Based Properties
- `canCreateTask`: Boolean - Can user create tasks
- `canEditTask`: Boolean - Can user edit tasks
- `canDeleteTask`: Boolean - Can user delete tasks

### TaskFormComponent

#### Inputs
- `task: Task | null`: Task to edit (null for create mode)
- `isOpen: boolean`: Modal visibility state

#### Outputs
- `close`: Emits when modal should close
- `save`: Emits task data to save (CreateTaskDto or UpdateTaskDto)

## Styling

The component uses TailwindCSS utility classes with custom CSS for:
- Drag & drop animations
- Dark mode transitions
- Loading states
- Hover effects
- Responsive breakpoints

### Dark Mode
Dark mode is toggled via a button in the header and persists in localStorage. The component automatically applies the `dark` class to `document.documentElement`.

## Accessibility

- Keyboard navigation support
- Focus-visible states
- ARIA labels (can be enhanced)
- Reduced motion support
- High contrast mode support
- Minimum touch target sizes (44px on mobile)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Optimizations

- TrackBy functions for ngFor loops
- OnPush change detection (can be added)
- Lazy loading compatible
- Unsubscribe on destroy
- Local state management

## Future Enhancements

Potential additions:
- Task priorities
- Task tags
- Bulk operations
- Export/Import tasks
- Task comments
- File attachments
- Activity log
- Real-time updates (WebSocket)
- Undo/Redo functionality
- Task templates
- Advanced filtering
- Custom columns

## License

Part of the Role-Based Task Management System
