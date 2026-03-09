import { Injectable, Logger, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import {
  AuthServiceClient,
  AuthLoginResponse,
  AuthRefreshResponse,
} from '../../integration/http/auth-service.client.js';

/**
 * Business logic layer for authentication.
 * Processes auth client responses and throws appropriate HTTP exceptions.
 * This separates business rules from the HTTP communication layer.
 */
@Injectable()
export class AuthBusinessService {
  private readonly logger = new Logger(AuthBusinessService.name);

  // Inject the auth HTTP client to communicate with auth service
  constructor(private readonly authClient: AuthServiceClient) {}

  /**
   * Authenticates user with email/password.
   * Returns tokens on success, throws UnauthorizedException on failure.
   */
  async login(email: string, password: string, traceId: string): Promise<AuthLoginResponse> {
    const response = await this.authClient.login({ email, password }, traceId);

    // If login failed, throw 401 Unauthorized
    if (!response.success || !response.data) {
      throw new UnauthorizedException(response.message || 'Login failed');
    }

    return response.data;
  }

  /**
   * Validates a JWT token and checks user status.
   * Throws appropriate exceptions if token is invalid, revoked, or user is banned.
   */
  async validateToken(token: string, traceId: string): Promise<void> {
    const response = await this.authClient.validateToken(token, traceId);

    // Token is structurally invalid or expired
    if (!response.success || !response.data) {
      throw new UnauthorizedException('Token validation failed');
    }

    // Token was manually invalidated (e.g., after logout)
    if (response.data.revoked) {
      throw new ForbiddenException('Token has been revoked');
    }

    // User account has been banned by admin
    if (response.data.banned) {
      throw new ForbiddenException('User account is banned');
    }
  }

  /**
   * Gets new access/refresh tokens using a valid refresh token.
   * Used when the access token expires but user should stay logged in.
   */
  async refreshToken(refreshToken: string, traceId: string): Promise<AuthRefreshResponse> {
    const response = await this.authClient.refreshToken(refreshToken, traceId);

    if (!response.success || !response.data) {
      throw new UnauthorizedException(response.message || 'Token refresh failed');
    }

    return response.data;
  }

  /**
   * Invalidates the user's token on the auth service.
   * Logs a warning if logout fails but doesn't throw (best-effort logout).
   */
  async logout(token: string, traceId: string): Promise<void> {
    const response = await this.authClient.logout(token, traceId);

    // Don't throw on logout failure - just log it
    // User experience shouldn't be blocked by logout issues
    if (!response.success) {
      this.logger.warn(`Logout failed: ${response.message}`);
    }
  }
}
