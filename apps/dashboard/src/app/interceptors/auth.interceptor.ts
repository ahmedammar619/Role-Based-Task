import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

/**
 * HTTP Interceptor to add JWT token to all outgoing requests
 * Automatically handles token injection and unauthorized responses
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Get token from AuthService
  const token = authService.getToken();

  // Clone the request and add authorization header if token exists
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Handle the request and catch any 401 errors
  return next(authReq).pipe(
    catchError((error) => {
      // Only logout if the 401 is from our own backend API (not external APIs like Gemini)
      if (error.status === 401 && error.url && error.url.startsWith(environment.apiUrl)) {
        authService.logout();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
