import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';
import { TRACE_ID_HEADER } from '../../utils/constants.js';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  // Create a logger with context name "HTTP"
  private readonly logger = new Logger('HTTP');

  // This method runs before and after the controller
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // Get HTTP request object
    const request = context.switchToHttp().getRequest<Request>();

    // Extract HTTP method (GET, POST, etc.) and URL
    const { method, url } = request;

    // Get trace ID from headers (used for tracking requests)
    const traceId = (request.headers[TRACE_ID_HEADER] as string) ?? 'unknown';

    // Save start time to calculate duration later
    const start = Date.now();

    // Continue request to controller
    return next.handle().pipe(
      // tap() runs after controller finishes (does not modify response)
      tap(() => {
        // Get HTTP response object
        const response = context.switchToHttp().getResponse<Response>();

        // Calculate how long request took
        const duration = Date.now() - start;

        // Log structured request details
        this.logger.log(
          JSON.stringify({
            traceId,
            method,
            url,
            statusCode: response.statusCode,
            duration: `${duration}ms`,
          }),
        );
      }),
    );
  }
}
