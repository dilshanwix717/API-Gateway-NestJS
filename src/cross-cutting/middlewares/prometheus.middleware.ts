import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Counter, Histogram } from 'prom-client';

/**
 * Counter = metric that only increases.
 * Used to count total number of HTTP requests.
 */
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  // Labels let us filter metrics by method, path, and status
  labelNames: ['method', 'path', 'status_code'] as const,
});

/**
 * Histogram = measures duration and groups results into buckets.
 * Useful for response time analysis (e.g., 95th percentile).
 */
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path', 'status_code'] as const,
  // Buckets define response time ranges (in seconds)
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

/**
 * Counter for failed requests (status >= 400).
 */
const httpRequestErrors = new Counter({
  name: 'http_request_errors_total',
  help: 'Total number of HTTP request errors',
  labelNames: ['method', 'path', 'status_code'] as const,
});

@Injectable()
export class PrometheusMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // Start high-precision timer (nanoseconds)
    const start = process.hrtime.bigint();

    const { method } = req;

    /**
     * Current approach:
     * Normalize dynamic values like UUIDs or numbers
     * to prevent high cardinality in Prometheus.
     */
    const path = this.normalizePath(req.path);

    /**
     * Production-grade alternative (RECOMMENDED):
     * Instead of guessing with regex,
     * use the actual Nest route pattern.
     *
     * This gives paths like "/users/:id"
     * instead of "/users/123"
     */
    /*
    const path =
      req.route && req.route.path
        ? req.baseUrl + req.route.path
        : req.path;
    */

    // When response finishes, record metrics
    res.on('finish', () => {
      // Calculate duration
      const durationNs = Number(process.hrtime.bigint() - start);
      const durationSeconds = durationNs / 1e9;

      const statusCode = res.statusCode.toString();

      // Increase total request counter
      httpRequestsTotal.inc({ method, path, status_code: statusCode });

      // Record request duration
      httpRequestDuration.observe({ method, path, status_code: statusCode }, durationSeconds);

      // If request failed (4xx or 5xx), increase error counter
      if (res.statusCode >= 400) {
        httpRequestErrors.inc({ method, path, status_code: statusCode });
      }
    });

    // Continue to next middleware/controller
    next();
  }

  /**
   * Normalize dynamic values to reduce Prometheus cardinality.
   *
   * Examples:
   *  /users/123 → /users/:id
   *  /orders/550e8400-e29b-41d4-a716-446655440000 → /orders/:id
   *
   * This prevents Prometheus from creating
   * thousands of unique metric labels.
   */
  private normalizePath(path: string): string {
    return (
      path
        // Replace UUIDs
        .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
        // Replace numeric IDs
        .replace(/\/\d+/g, '/:id')
    );
  }
}
