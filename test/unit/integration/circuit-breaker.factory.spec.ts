import { Logger } from '@nestjs/common';
import { createCircuitBreaker } from '../../../src/integration/resilience/circuit-breaker.factory.js';

describe('CircuitBreakerFactory', () => {
  const logger = new Logger('Test');
  const config = {
    timeout: 1000,
    errorThresholdPercentage: 50,
    resetTimeout: 5000,
  };

  it('should create a circuit breaker that calls the function', async () => {
    const fn = jest.fn().mockResolvedValue('result');
    const breaker = createCircuitBreaker(fn, 'test-service', config, logger);

    const result = await breaker.fire();
    expect(result).toBe('result');
    expect(fn).toHaveBeenCalled();
  });

  it('should open circuit after threshold failures', async () => {
    let callCount = 0;
    const fn = jest.fn().mockImplementation(() => {
      callCount++;
      return Promise.reject(new Error(`failure-${callCount}`));
    });

    const breaker = createCircuitBreaker(
      fn,
      'test-service',
      {
        ...config,
        errorThresholdPercentage: 1,
      },
      logger,
    );

    // Force enough failures to open circuit
    for (let i = 0; i < 5; i++) {
      try {
        await breaker.fire();
      } catch {
        // expected
      }
    }

    expect(breaker.opened).toBe(true);
  });
});
