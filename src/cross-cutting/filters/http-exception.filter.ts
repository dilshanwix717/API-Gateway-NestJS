import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponse } from '../../interfaces/api-response.interface.js';
import { TRACE_ID_HEADER } from '../../utils/constants.js';

// Catch ALL exceptions in HTTP context
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  // Logger for error logging
  private readonly logger = new Logger(HttpExceptionFilter.name);

  // This method runs whenever an error is thrown
  catch(exception: unknown, host: ArgumentsHost): void {
    // Switch to HTTP context
    const ctx = host.switchToHttp();

    // Get request and response objects
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    // Get trace ID from request header (used for tracking)
    const traceId = (request.headers[TRACE_ID_HEADER] as string) ?? 'unknown';

    // Default error values (used if error type is unknown)
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    // If error is a NestJS HttpException (like 400, 401, 404)
    if (exception instanceof HttpException) {
      status = exception.getStatus(); // Get correct HTTP status

      const exceptionResponse = exception.getResponse();

      // Extract error message safely
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : ((exceptionResponse as Record<string, unknown>)['message']?.toString() ??
            exception.message);

      // If it's a normal JavaScript error
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Log structured error details
    this.logger.error(
      JSON.stringify({
        traceId,
        method: request.method,
        url: request.url,
        statusCode: status,
        error: message,
      }),
    );

    // Standard API error response format
    const body: ApiResponse<null> = {
      success: false,
      message,
      data: null,
      traceId,
    };

    // Send error response to client
    response.status(status).json(body);
  }
}
