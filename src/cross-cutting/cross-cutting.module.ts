import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';

import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { LoggingInterceptor } from './interceptors/logging.interceptor.js';
import { ResponseTransformInterceptor } from './interceptors/response-transform.interceptor.js';
import { TimeoutInterceptor } from './interceptors/timeout.interceptor.js';
import { HttpExceptionFilter } from './filters/http-exception.filter.js';
import { RoleThrottlerGuard } from './rate-limiting/role-throttler.guard.js';
import { AppConfig } from '../config/app.config.js';

/**
 * CrossCuttingModule ->
 * This module contains global application-level concerns l
 * Everything registered using APP_* tokens becomes GLOBAL.
 */
@Module({
  imports: [
    //ThrottlerModule handles rate limiting. We configure it asynchronously to read settings from ConfigService.
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const appCfg = configService.get<AppConfig>('app');

        return {
          throttlers: [
            {
              // Time window in milliseconds
              ttl: (appCfg?.throttle.ttlSeconds ?? 60) * 1000,

              // Max requests allowed within TTL
              limit: appCfg?.throttle.limitUnauthenticated ?? 10,
            },
          ],
        };
      },
    }),
  ],

  providers: [
    // GLOBAL GUARDS - execute in the order they are provided.

    //Validates JWT and attaches user to request
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    //Checks user roles (authorization)
    { provide: APP_GUARD, useClass: RolesGuard },
    //Applies role-based rate limiting
    { provide: APP_GUARD, useClass: RoleThrottlerGuard },

    // GLOBAL INTERCEPTORS -  run around request/response lifecycle.

    // Logs request + response data
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    // Wraps responses into standard format
    { provide: APP_INTERCEPTOR, useClass: ResponseTransformInterceptor },
    // Cancels requests that exceed timeout
    { provide: APP_INTERCEPTOR, useClass: TimeoutInterceptor },
    // GLOBAL FILTER - Catches unhandled exceptions and formats errors.
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class CrossCuttingModule {}
