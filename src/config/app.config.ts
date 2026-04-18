import { registerAs } from '@nestjs/config';

// Strongly typed application configuration interface
export interface AppConfig {
  port: number;
  nodeEnv: string;

  jwt: {
    publicKey: string;
  };

  services: {
    authServiceUrl: string;
    userServiceUrl: string;
    videoServiceUrl: string;
  };

  rabbitmq: {
    url: string;
  };

  redis: {
    host: string;
    port: number;
  };

  jaeger: {
    endpoint: string;
  };

  throttle: {
    ttlSeconds: number;
    limitUnauthenticated: number;
    limitAuthenticated: number;
    limitAdmin: number;
  };

  circuitBreaker: {
    timeout: number;
    errorThresholdPercentage: number;
    resetTimeout: number;
  };

  requestTimeout: number;
  cacheTtlSeconds: number;
  internalApiKey: string;
}

// Register configuration under namespace "app"
export const appConfig = registerAs(
  'app',
  (): AppConfig => ({
    // Server
    port: parseInt(process.env['PORT'] ?? '3000', 10),
    nodeEnv: process.env['NODE_ENV'] ?? 'development',

    // JWT verification key (public key for RS256)
    // Support both PEM format (with \n) and base64-encoded PEM
    jwt: {
      publicKey: (() => {
        const raw = process.env['JWT_PUBLIC_KEY'] ?? '';
        // If it looks like base64 (no PEM header), decode it
        if (!raw.includes('-----BEGIN')) {
          return Buffer.from(raw, 'base64').toString('utf-8');
        }
        // Otherwise replace escaped newlines with actual newlines
        return raw.replace(/\\n/g, '\n');
      })(),
    },

    // Downstream microservices
    services: {
      authServiceUrl: process.env['AUTH_SERVICE_URL'] ?? '',
      userServiceUrl: process.env['USER_SERVICE_URL'] ?? '',
      videoServiceUrl: process.env['VIDEO_SERVICE_URL'] ?? '',
    },

    // RabbitMQ connection
    rabbitmq: {
      url: process.env['RABBITMQ_URL'] ?? '',
    },

    // Redis connection
    redis: {
      host: process.env['REDIS_HOST'] ?? 'localhost',
      port: parseInt(process.env['REDIS_PORT'] ?? '6379', 10),
    },

    // Jaeger tracing endpoint
    jaeger: {
      endpoint: process.env['JAEGER_ENDPOINT'] ?? 'http://localhost:14268/api/traces',
    },

    // Rate limiting configuration
    throttle: {
      ttlSeconds: parseInt(process.env['THROTTLE_TTL_SECONDS'] ?? '60', 10),
      limitUnauthenticated: parseInt(process.env['THROTTLE_LIMIT_UNAUTHENTICATED'] ?? '10', 10),
      limitAuthenticated: parseInt(process.env['THROTTLE_LIMIT_AUTHENTICATED'] ?? '60', 10),
      limitAdmin: parseInt(process.env['THROTTLE_LIMIT_ADMIN'] ?? '200', 10),
    },

    // Circuit breaker defaults (for downstream services)
    circuitBreaker: {
      timeout: parseInt(process.env['CIRCUIT_BREAKER_TIMEOUT'] ?? '5000', 10),
      errorThresholdPercentage: parseInt(
        process.env['CIRCUIT_BREAKER_ERROR_THRESHOLD'] ?? '50',
        10,
      ),
      resetTimeout: parseInt(process.env['CIRCUIT_BREAKER_RESET_TIMEOUT'] ?? '30000', 10),
    },

    // Global request timeout (ms)
    requestTimeout: parseInt(process.env['REQUEST_TIMEOUT'] ?? '10000', 10),

    // Default cache TTL (seconds)
    cacheTtlSeconds: parseInt(process.env['CACHE_TTL_SECONDS'] ?? '300', 10),

    // Shared secret for internal service-to-service API calls
    internalApiKey: process.env['INTERNAL_API_KEY'] ?? '',
  }),
);
