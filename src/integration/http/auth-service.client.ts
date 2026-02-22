import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { BaseHttpClient } from './base-http.client.js';
import { ServiceResponse } from '../../interfaces/service-response.interface.js';
import { AppConfig } from '../../config/app.config.js';

export interface AuthSignupResponse {
  user_id: string;
  token: string;
}

export interface AuthLoginResponse {
  token: string;
  refresh_token: string;
}

export interface AuthValidateResponse {
  valid: boolean;
  revoked: boolean;
  banned: boolean;
}

export interface AuthRefreshResponse {
  token: string;
  refresh_token: string;
}

@Injectable()
export class AuthServiceClient extends BaseHttpClient {
  constructor(httpService: HttpService, configService: ConfigService) {
    const appCfg = configService.get<AppConfig>('app');
    super(httpService, configService, 'AuthServiceClient', appCfg?.services.authServiceUrl ?? '');
  }

  async signup(
    data: { email: string; password: string },
    traceId: string,
  ): Promise<ServiceResponse<AuthSignupResponse>> {
    return this.post<AuthSignupResponse>('/auth/signup', traceId, data);
  }

  async login(
    data: { email: string; password: string },
    traceId: string,
  ): Promise<ServiceResponse<AuthLoginResponse>> {
    return this.post<AuthLoginResponse>('/auth/login', traceId, data);
  }

  async validateToken(
    token: string,
    traceId: string,
  ): Promise<ServiceResponse<AuthValidateResponse>> {
    return this.post<AuthValidateResponse>('/auth/validate-token', traceId, { token });
  }

  async refreshToken(
    refreshToken: string,
    traceId: string,
  ): Promise<ServiceResponse<AuthRefreshResponse>> {
    return this.post<AuthRefreshResponse>('/auth/refresh-token', traceId, {
      refresh_token: refreshToken,
    });
  }

  async logout(token: string, traceId: string): Promise<ServiceResponse<null>> {
    return this.post<null>('/auth/logout', traceId, { token });
  }

  async deleteUser(userId: string, traceId: string): Promise<ServiceResponse<null>> {
    return this.delete<null>(`/auth/users/${userId}`, traceId);
  }
}
