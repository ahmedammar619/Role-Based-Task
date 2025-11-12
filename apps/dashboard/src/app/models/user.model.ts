export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  VIEWER = 'viewer',
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  organizationId: string;
  organization?: Organization;
}

export interface Organization {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  role: UserRole;
  organizationId: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}
