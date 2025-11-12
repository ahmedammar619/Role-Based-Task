import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Organization, UserRole } from '../../models/user.model';
import { OrganizationService } from '../../services/organization.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  errorMessage: string = '';
  organizationLoadError: string = '';
  isLoading: boolean = false;
  isOrganizationsLoading: boolean = false;

  roles = [
    { value: UserRole.OWNER, label: 'Owner' },
    { value: UserRole.ADMIN, label: 'Admin' },
    { value: UserRole.VIEWER, label: 'Viewer' },
  ];

  organizations: Organization[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private organizationService: OrganizationService,
    private router: Router
  ) {
    this.registerForm = this.fb.group(
      {
        username: ['', [Validators.required, Validators.minLength(3)]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
        role: ['', [Validators.required]],
        organizationId: ['', [Validators.required]],
      },
      {
        validators: this.passwordMatchValidator,
      }
    );
  }

  ngOnInit(): void {
    this.loadOrganizations();
  }

  private loadOrganizations(): void {
    this.isOrganizationsLoading = true;
    this.organizationLoadError = '';

    this.organizationService.getOrganizations().subscribe({
      next: (organizations) => {
        this.organizations = organizations;
        this.isOrganizationsLoading = false;
        if (organizations.length === 1) {
          this.registerForm.patchValue({
            organizationId: organizations[0].id,
          });
        }
      },
      error: (error) => {
        this.isOrganizationsLoading = false;
        this.organizationLoadError =
          error.message || 'Failed to load organizations';
        console.error('Failed to load organizations:', error);
      },
    });
  }

  // Custom validator for password matching
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value
      ? null
      : { passwordMismatch: true };
  }

  get username() {
    return this.registerForm.get('username');
  }

  get password() {
    return this.registerForm.get('password');
  }

  get confirmPassword() {
    return this.registerForm.get('confirmPassword');
  }

  get role() {
    return this.registerForm.get('role');
  }

  get organizationId() {
    return this.registerForm.get('organizationId');
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Extract data without confirmPassword
    const { confirmPassword, ...registerData } = this.registerForm.value;

    this.authService.register(registerData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage =
          error.message || 'Registration failed. Please try again.';
      },
    });
  }
}
