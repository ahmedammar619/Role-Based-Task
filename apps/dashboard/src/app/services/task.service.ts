import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  Task,
  CreateTaskDto,
  UpdateTaskDto,
} from '../models/task.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly apiUrl = `${environment.apiUrl}/tasks`;

  constructor(private http: HttpClient) {}

  /**
   * Get all tasks
   */
  getTasks(): Observable<Task[]> {
    return this.http
      .get<Task[]>(this.apiUrl, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get a single task by ID
   */
  getTask(id: string): Observable<Task> {
    return this.http
      .get<Task>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  /**
   * Create a new task
   */
  createTask(task: CreateTaskDto): Observable<Task> {
    return this.http
      .post<Task>(this.apiUrl, task, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  /**
   * Update an existing task
   */
  updateTask(id: string, task: UpdateTaskDto): Observable<Task> {
    return this.http
      .patch<Task>(`${this.apiUrl}/${id}`, task, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  /**
   * Delete a task
   */
  deleteTask(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get HTTP headers with JWT token
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Backend error
      if (error.status === 401) {
        errorMessage = 'Unauthorized: Please log in again';
      } else if (error.status === 403) {
        errorMessage = 'Forbidden: You do not have permission to perform this action';
      } else if (error.status === 404) {
        errorMessage = 'Task not found';
      } else {
        errorMessage =
          error.error?.message ||
          `Server returned code ${error.status}: ${error.message}`;
      }
    }

    console.error('Task Service Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
