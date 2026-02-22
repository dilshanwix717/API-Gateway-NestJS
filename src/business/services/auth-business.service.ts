import { Injectable, Logger, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import {
  AuthServiceClient,
  AuthLoginResponse,
  AuthRefreshResponse,
} from '../../integration/http/auth-service.client.js';

@Injectable()
export class AuthBusinessService {
  private readonly logger = new Logger(AuthBusinessService.name);

  constructor(private readonly authClient: AuthServiceClient) {}

  async login(email: string, password: string, traceId: string): Promise<AuthLoginResponse> {
    const response = await this.authClient.login({ email, password }, traceId);

    if (!response.success || !response.data) {
      throw new UnauthorizedException(response.message || 'Login failed');
    }

    return response.data;
  }

  async validateToken(token: string, traceId: string): Promise<void> {
    const response = await this.authClient.validateToken(token, traceId);

    if (!response.success || !response.data) {
      throw new UnauthorizedException('Token validation failed');
    }

    if (response.data.revoked) {
      throw new ForbiddenException('Token has been revoked');
    }

    if (response.data.banned) {
      throw new ForbiddenException('User account is banned');
    }
  }

  async refreshToken(refreshToken: string, traceId: string): Promise<AuthRefreshResponse> {
    const response = await this.authClient.refreshToken(refreshToken, traceId);

    if (!response.success || !response.data) {
      throw new UnauthorizedException(response.message || 'Token refresh failed');
    }

    return response.data;
  }

  async logout(token: string, traceId: string): Promise<void> {
    const response = await this.authClient.logout(token, traceId);

    if (!response.success) {
      this.logger.warn(`Logout failed: ${response.message}`);
    }
  }
}
