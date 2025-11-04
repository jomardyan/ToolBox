// backend/src/types/auth.ts

import { Request } from 'express';

export interface JwtPayload {
  userId: string;
  email: string;
  role: 'admin' | 'user';
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
  apiKey?: {
    id: string;
    userId: string;
    keyPrefix: string;
  };
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ResetPasswordInput {
  email: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}
