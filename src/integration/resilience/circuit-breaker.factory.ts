import CircuitBreaker from 'opossum';
import { Logger } from '@nestjs/common';

export interface CircuitBreakerConfig {
  timeout: number;
  errorThresholdPercentage: number;
  resetTimeout: number;
}

export function createCircuitBreaker<TInput extends unknown[], TOutput>(
  fn: (...args: TInput) => Promise<TOutput>,
  serviceName: string,
  config: CircuitBreakerConfig,
  logger: Logger,
): CircuitBreaker<TInput, TOutput> {
  const breaker = new CircuitBreaker(fn, {
    timeout: config.timeout,
    errorThresholdPercentage: config.errorThresholdPercentage,
    resetTimeout: config.resetTimeout,
    name: serviceName,
  });

  breaker.on('open', () => {
    logger.warn(`Circuit breaker OPEN for ${serviceName}`);
  });

  breaker.on('halfOpen', () => {
    logger.log(`Circuit breaker HALF-OPEN for ${serviceName}`);
  });

  breaker.on('close', () => {
    logger.log(`Circuit breaker CLOSED for ${serviceName}`);
  });

  breaker.on('fallback', () => {
    logger.warn(`Circuit breaker FALLBACK triggered for ${serviceName}`);
  });

  return breaker;
}
