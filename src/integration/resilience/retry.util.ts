import { Logger } from '@nestjs/common';

export interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelayMs: 200,
  maxDelayMs: 5000,
};

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {},
  logger?: Logger,
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === config.maxRetries) {
        break;
      }

      const delay = Math.min(config.baseDelayMs * Math.pow(2, attempt), config.maxDelayMs);
      const jitter = delay * (0.5 + Math.random() * 0.5);

      logger?.warn(
        `Retry attempt ${attempt + 1}/${config.maxRetries} after ${Math.round(jitter)}ms: ${lastError.message}`,
      );

      await new Promise((resolve) => setTimeout(resolve, jitter));
    }
  }

  throw lastError ?? new Error('Retry failed');
}
