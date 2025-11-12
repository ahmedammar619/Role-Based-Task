import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Subject, takeUntil } from 'rxjs';

import { Task, TaskStatus, TaskCategory, CreateTaskDto, UpdateTaskDto } from '../../models/task.model';
import { User, UserRole } from '../../models/user.model';
import { TaskService } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';
import { TaskFormComponent } from '../task-form/task-form.component';

type SortOption = 'date' | 'title' | 'priority';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, TaskFormComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // User data
  currentUser: User | null = null;
  UserRole = UserRole;

  // Tasks data
  allTasks: Task[] = [];
  todoTasks: Task[] = [];
  inProgressTasks: Task[] = [];
  doneTasks: Task[] = [];

  // UI state
  isLoading = false;
  error: string | null = null;
  isDarkMode = false;

  // Filter and search
  selectedCategory: TaskCategory | 'all' = 'all';
  searchQuery = '';
  sortBy: SortOption = 'date';

  // Modal state
  isFormOpen = false;
  selectedTask: Task | null = null;

  // Task to delete
  taskToDelete: Task | null = null;
  isDeleteModalOpen = false;

  // Category options
  categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: TaskCategory.WORK, label: 'Work' },
    { value: TaskCategory.PERSONAL, label: 'Personal' },
    { value: TaskCategory.URGENT, label: 'Urgent' },
    { value: TaskCategory.OTHER, label: 'Other' }
  ];

  // Statistics
  get todoCount(): number {
    return this.todoTasks.length;
  }

  get inProgressCount(): number {
    return this.inProgressTasks.length;
  }

  get doneCount(): number {
    return this.doneTasks.length;
  }

  get totalCount(): number {
    return this.allTasks.length;
  }

  get completionPercentage(): number {
    if (this.totalCount === 0) return 0;
    return Math.round((this.doneCount / this.totalCount) * 100);
  }

  // Role-based permissions
  get canCreateTask(): boolean {
    return this.currentUser?.role === UserRole.OWNER || this.currentUser?.role === UserRole.ADMIN;
  }

  get canEditTask(): boolean {
    return this.currentUser?.role === UserRole.OWNER || this.currentUser?.role === UserRole.ADMIN;
  }

  get canDeleteTask(): boolean {
    return this.currentUser?.role === UserRole.OWNER || this.currentUser?.role === UserRole.ADMIN;
  }

  constructor(
    private taskService: TaskService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Load dark mode preference
    this.isDarkMode = localStorage.getItem('darkMode') === 'true';
    this.applyDarkMode();

    // Get current user
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.currentUser = user;
    });

    // Load tasks
    this.loadTasks();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Load tasks from API
  loadTasks(): void {
    this.isLoading = true;
    this.error = null;

    this.taskService.getTasks().pipe(takeUntil(this.destroy$)).subscribe({
      next: (tasks) => {
        this.allTasks = tasks;
        this.organizeTasks();
        this.isLoading = false;
      },
      error: (error) => {
        this.error = error.message || 'Failed to load tasks';
        this.isLoading = false;
        console.error('Error loading tasks:', error);
      }
    });
  }

  // Organize tasks into columns
  organizeTasks(): void {
    const filtered = this.filterAndSearchTasks(this.allTasks);
    const sorted = this.sortTasks(filtered);

    this.todoTasks = sorted.filter(task => task.status === TaskStatus.TODO);
    this.inProgressTasks = sorted.filter(task => task.status === TaskStatus.IN_PROGRESS);
    this.doneTasks = sorted.filter(task => task.status === TaskStatus.DONE);
  }

  // Filter tasks by category and search query
  filterAndSearchTasks(tasks: Task[]): Task[] {
    let filtered = [...tasks];

    // Filter by category
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(task => task.category === this.selectedCategory);
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }

  // Sort tasks
  sortTasks(tasks: Task[]): Task[] {
    return [...tasks].sort((a, b) => {
      switch (this.sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'priority':
          // Priority: Urgent > Work > Personal > Other
          const priorityMap: Record<TaskCategory, number> = {
            [TaskCategory.URGENT]: 4,
            [TaskCategory.WORK]: 3,
            [TaskCategory.PERSONAL]: 2,
            [TaskCategory.OTHER]: 1
          };
          return priorityMap[b.category] - priorityMap[a.category];
        case 'date':
        default:
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
    });
  }

  // Drag and drop handler
  onDrop(event: CdkDragDrop<Task[]>, newStatus: TaskStatus): void {
    if (!this.canEditTask) {
      this.error = 'You do not have permission to move tasks';
      setTimeout(() => this.error = null, 3000);
      return;
    }

    if (event.previousContainer === event.container) {
      // Reordering within the same list
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Moving to a different list
      const task = event.previousContainer.data[event.previousIndex];

      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      // Update task status on backend
      const updateData: UpdateTaskDto = { status: newStatus };
      this.taskService.updateTask(task.id, updateData).pipe(takeUntil(this.destroy$)).subscribe({
        next: (updatedTask) => {
          // Update task in allTasks array
          const index = this.allTasks.findIndex(t => t.id === task.id);
          if (index !== -1) {
            this.allTasks[index] = updatedTask;
          }
        },
        error: (error) => {
          this.error = error.message || 'Failed to update task status';
          setTimeout(() => this.error = null, 3000);
          // Revert the change
          this.organizeTasks();
        }
      });
    }
  }

  // Open create task modal
  openCreateModal(): void {
    if (!this.canCreateTask) {
      this.error = 'You do not have permission to create tasks';
      setTimeout(() => this.error = null, 3000);
      return;
    }
    this.selectedTask = null;
    this.isFormOpen = true;
  }

  // Open edit task modal
  openEditModal(task: Task): void {
    if (!this.canEditTask) {
      this.error = 'You do not have permission to edit tasks';
      setTimeout(() => this.error = null, 3000);
      return;
    }
    this.selectedTask = task;
    this.isFormOpen = true;
  }

  // Close task form modal
  closeTaskForm(): void {
    this.isFormOpen = false;
    this.selectedTask = null;
  }

  // Handle task save (create or update)
  onTaskSave(data: CreateTaskDto | { id: string; data: UpdateTaskDto }): void {
    if ('id' in data) {
      // Update existing task
      this.taskService.updateTask(data.id, data.data).pipe(takeUntil(this.destroy$)).subscribe({
        next: (updatedTask) => {
          const index = this.allTasks.findIndex(t => t.id === data.id);
          if (index !== -1) {
            this.allTasks[index] = updatedTask;
          }
          this.organizeTasks();
          this.closeTaskForm();
        },
        error: (error) => {
          this.error = error.message || 'Failed to update task';
          setTimeout(() => this.error = null, 3000);
        }
      });
    } else {
      // Create new task
      this.taskService.createTask(data).pipe(takeUntil(this.destroy$)).subscribe({
        next: (newTask) => {
          this.allTasks.push(newTask);
          this.organizeTasks();
          this.closeTaskForm();
        },
        error: (error) => {
          this.error = error.message || 'Failed to create task';
          setTimeout(() => this.error = null, 3000);
        }
      });
    }
  }

  // Open delete confirmation modal
  confirmDelete(task: Task): void {
    if (!this.canDeleteTask) {
      this.error = 'You do not have permission to delete tasks';
      setTimeout(() => this.error = null, 3000);
      return;
    }
    this.taskToDelete = task;
    this.isDeleteModalOpen = true;
  }

  // Close delete confirmation modal
  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.taskToDelete = null;
  }

  // Delete task
  deleteTask(): void {
    if (!this.taskToDelete) return;

    const taskId = this.taskToDelete.id;
    this.taskService.deleteTask(taskId).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.allTasks = this.allTasks.filter(t => t.id !== taskId);
        this.organizeTasks();
        this.closeDeleteModal();
      },
      error: (error) => {
        this.error = error.message || 'Failed to delete task';
        setTimeout(() => this.error = null, 3000);
        this.closeDeleteModal();
      }
    });
  }

  // Filter change handler
  onCategoryChange(): void {
    this.organizeTasks();
  }

  // Search change handler
  onSearchChange(): void {
    this.organizeTasks();
  }

  // Sort change handler
  onSortChange(): void {
    this.organizeTasks();
  }

  // Toggle dark mode
  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('darkMode', String(this.isDarkMode));
    this.applyDarkMode();
  }

  // Apply dark mode to document
  private applyDarkMode(): void {
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  // Logout
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Get category badge color
  getCategoryColor(category: TaskCategory): string {
    const colors: Record<TaskCategory, string> = {
      [TaskCategory.WORK]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      [TaskCategory.PERSONAL]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      [TaskCategory.URGENT]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      [TaskCategory.OTHER]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    return colors[category];
  }

  // Format date
  formatDate(date: Date | string | undefined): string {
    if (!date) return 'No due date';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // Get role badge color
  getRoleBadgeColor(role: UserRole): string {
    const colors: Record<UserRole, string> = {
      [UserRole.OWNER]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      [UserRole.ADMIN]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      [UserRole.VIEWER]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    return colors[role];
  }

  // Track by function for ngFor
  trackByTaskId(index: number, task: Task): string {
    return task.id;
  }
}
