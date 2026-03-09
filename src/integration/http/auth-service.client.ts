import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { BaseHttpClient } from './base-http.client.js';
import { ServiceResponse } from '../../interfaces/service-response.interface.js';
import { AppConfig } from '../../config/app.config.js';

// Response types define what the auth service returns for each operation

export interface AuthSignupResponse {
  user_id: string; // The newly created user's ID
  token: string; // JWT token for immediate authentication
}

export interface AuthLoginResponse {
  token: string; // JWT access token (short-lived)
  refresh_token: string; // Token to get new access tokens (long-lived)
}

export interface AuthValidateResponse {
  valid: boolean; // Is the token structurally valid?
  revoked: boolean; // Has the token been manually invalidated?
  banned: boolean; // Is the user account banned?
}

export interface AuthRefreshResponse {
  token: string; // New access token
  refresh_token: string; // New refresh token
}

/**
 * HTTP client for communicating with the Auth microservice.
 * Handles all authentication-related API calls (signup, login, logout, etc.)
 */
@Injectable()
export class AuthServiceClient extends BaseHttpClient {
  constructor(httpService: HttpService, configService: ConfigService) {
    // Get auth service URL from config and pass to parent class
    const appCfg = configService.get<AppConfig>('app');
    super(httpService, configService, 'AuthServiceClient', appCfg?.services.authServiceUrl ?? '');
  }

  // Register a new user account
  async signup(
    data: { email: string; password: string },
    traceId: string,
  ): Promise<ServiceResponse<AuthSignupResponse>> {
    return this.post<AuthSignupResponse>('/auth/signup', traceId, data);
  }

  // Authenticate user and get access + refresh tokens
  async login(
    data: { email: string; password: string },
    traceId: string,
  ): Promise<ServiceResponse<AuthLoginResponse>> {
    return this.post<AuthLoginResponse>('/auth/login', traceId, data);
  }

  // Check if a JWT token is valid and not revoked/banned
  async validateToken(
    token: string,
    traceId: string,
  ): Promise<ServiceResponse<AuthValidateResponse>> {
    return this.post<AuthValidateResponse>('/auth/validate-token', traceId, { token });
  }

  // Exchange a refresh token for new access + refresh tokens
  async refreshToken(
    refreshToken: string,
    traceId: string,
  ): Promise<ServiceResponse<AuthRefreshResponse>> {
    return this.post<AuthRefreshResponse>('/auth/refresh-token', traceId, {
      refresh_token: refreshToken,
    });
  }

  // Invalidate the user's token (mark it as revoked)
  async logout(token: string, traceId: string): Promise<ServiceResponse<null>> {
    return this.post<null>('/auth/logout', traceId, { token });
  }

  // Remove a user's auth data from the auth service
  async deleteUser(userId: string, traceId: string): Promise<ServiceResponse<null>> {
    return this.delete<null>(`/auth/users/${userId}`, traceId);
  }
}
