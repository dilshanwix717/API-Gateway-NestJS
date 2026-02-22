import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import { JwtPayload } from '../../interfaces/jwt-payload.interface.js';
import { AuthenticatedRequest } from '../../interfaces/request.interface.js';
import { AppConfig } from '../../config/app.config.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  // Logger to log JWT validation issues
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    // Used to read metadata like @Public()
    private readonly reflector: Reflector,

    // Used to access environment/config values (JWT keys)
    private readonly configService: ConfigService,
  ) {}

  // This method decides whether request can continue
  canActivate(context: ExecutionContext): boolean {
    // Check if route is marked as @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If public route → skip authentication
    if (isPublic) return true;

    // Get HTTP request object
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    // Read Authorization header
    const authHeader = request.headers.authorization;

    // Validate header format: "Bearer <token>"
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    // Extract token from header
    const token = authHeader.substring(7);

    // Get JWT public key from config
    const appCfg = this.configService.get<AppConfig>('app');
    const publicKey = appCfg?.jwt.publicKey ?? '';

    try {
      // Verify token signature and expiration
      const decoded = jwt.verify(token, publicKey, {
        algorithms: ['RS256'],
      }) as JwtPayload;

      // Attach decoded user data to request
      request.user = decoded;

      // Allow request to continue
      return true;
    } catch (error) {
      // Log validation error
      const message = error instanceof Error ? error.message : 'Token verification failed';
      this.logger.warn(`JWT validation failed: ${message}`);

      // Reject request with 401
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
