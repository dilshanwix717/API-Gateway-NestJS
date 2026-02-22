import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),

  JWT_PUBLIC_KEY: Joi.string().required(),

  AUTH_SERVICE_URL: Joi.string().uri().required(),
  USER_SERVICE_URL: Joi.string().uri().required(),
  VIDEO_SERVICE_URL: Joi.string().uri().required(),

  RABBITMQ_URL: Joi.string().required(),

  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),

  JAEGER_ENDPOINT: Joi.string().uri().default('http://localhost:14268/api/traces'),

  THROTTLE_TTL_SECONDS: Joi.number().default(60),
  THROTTLE_LIMIT_UNAUTHENTICATED: Joi.number().default(10),
  THROTTLE_LIMIT_AUTHENTICATED: Joi.number().default(60),
  THROTTLE_LIMIT_ADMIN: Joi.number().default(200),

  CIRCUIT_BREAKER_TIMEOUT: Joi.number().default(5000),
  CIRCUIT_BREAKER_ERROR_THRESHOLD: Joi.number().default(50),
  CIRCUIT_BREAKER_RESET_TIMEOUT: Joi.number().default(30000),

  REQUEST_TIMEOUT: Joi.number().default(10000),

  CACHE_TTL_SECONDS: Joi.number().default(300),
});
