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
  refresh_token: string; // Refresh token for token rotation
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
    // Auth service expects { email, password, confirmPassword } at /v1/auth/register
    // and wraps response in { success, data: { accessToken, refreshToken, userId, ... } }
    const rawResponse = await this.post<{
      accessToken: string;
      refreshToken: string;
      userId: string;
      expiresIn: number;
      tokenType: string;
    }>('/v1/auth/register', traceId, {
      email: data.email,
      password: data.password,
      confirmPassword: data.password,
    });

    // Map auth service response shape to gateway's expected shape
    if (rawResponse.success && rawResponse.data) {
      return {
        success: true,
        message: rawResponse.message,
        data: {
          user_id: rawResponse.data.userId,
          token: rawResponse.data.accessToken,
          refresh_token: rawResponse.data.refreshToken,
        },
        statusCode: rawResponse.statusCode,
      };
    }

    return {
      success: false,
      message: rawResponse.message,
      data: null,
      statusCode: rawResponse.statusCode,
    };
  }

  // Authenticate user and get access + refresh tokens
  async login(
    data: { email: string; password: string },
    traceId: string,
  ): Promise<ServiceResponse<AuthLoginResponse>> {
    // Auth service returns { accessToken, refreshToken, userId, expiresIn, tokenType }
    const rawResponse = await this.post<{
      accessToken: string;
      refreshToken: string;
      userId: string;
      expiresIn: number;
      tokenType: string;
    }>('/v1/auth/login', traceId, data);

    // Map to gateway's expected shape
    if (rawResponse.success && rawResponse.data) {
      return {
        success: true,
        message: rawResponse.message,
        data: {
          token: rawResponse.data.accessToken,
          refresh_token: rawResponse.data.refreshToken,
        },
        statusCode: rawResponse.statusCode,
      };
    }

    return {
      success: false,
      message: rawResponse.message,
      data: null,
      statusCode: rawResponse.statusCode,
    };
  }

  // Check if a JWT token is valid and not revoked/banned
  async validateToken(
    token: string,
    traceId: string,
  ): Promise<ServiceResponse<AuthValidateResponse>> {
    // Auth service validate-token returns { valid, payload, reason }
    const rawResponse = await this.post<{
      valid: boolean;
      payload?: { sub: string };
      reason?: string;
    }>('/v1/auth/validate-token', traceId, { token });

    if (rawResponse.success && rawResponse.data) {
      return {
        success: true,
        message: rawResponse.message,
        data: {
          valid: rawResponse.data.valid,
          revoked: rawResponse.data.reason === 'blacklisted' || rawResponse.data.reason === 'token_revoked',
          banned: rawResponse.data.reason === 'account_banned',
        },
        statusCode: rawResponse.statusCode,
      };
    }

    return {
      success: false,
      message: rawResponse.message,
      data: null,
      statusCode: rawResponse.statusCode,
    };
  }

  // Exchange a refresh token for new access + refresh tokens
  async refreshToken(
    refreshToken: string,
    traceId: string,
  ): Promise<ServiceResponse<AuthRefreshResponse>> {
    // Auth service expects { refreshToken } (camelCase)
    const rawResponse = await this.post<{
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
      tokenType: string;
    }>('/v1/auth/refresh-token', traceId, {
      refreshToken: refreshToken,
    });

    if (rawResponse.success && rawResponse.data) {
      return {
        success: true,
        message: rawResponse.message,
        data: {
          token: rawResponse.data.accessToken,
          refresh_token: rawResponse.data.refreshToken,
        },
        statusCode: rawResponse.statusCode,
      };
    }

    return {
      success: false,
      message: rawResponse.message,
      data: null,
      statusCode: rawResponse.statusCode,
    };
  }

  // Invalidate the user's token (mark it as revoked)
  async logout(accessToken: string, refreshToken: string, traceId: string): Promise<ServiceResponse<null>> {
    // Auth service expects { refreshToken } in body and access token in Authorization header
    return this.postWithAuthHeader<null>('/v1/auth/logout', traceId, {
      refreshToken: refreshToken,
    }, accessToken);
  }

  // Remove a user's auth data from the auth service (compensating transaction)
  async deleteUser(userId: string, traceId: string): Promise<ServiceResponse<null>> {
    return this.delete<null>(`/v1/accounts/${userId}/credentials`, traceId);
  }
}
