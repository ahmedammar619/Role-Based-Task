import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Organization } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class OrganizationService {
  constructor(private http: HttpClient) {}

  getOrganizations(): Observable<Organization[]> {
    return this.http
      .get<Organization[]>(`${environment.apiUrl}/organizations`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const message =
      error.error?.message ??
      (error.status
        ? `Failed to load organizations (status ${error.status})`
        : 'Failed to load organizations');
    return throwError(() => new Error(message));
  }
}

