import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Request } from 'express';
import { ApiResponse } from '../../interfaces/api-response.interface.js';
import { TRACE_ID_HEADER } from '../../utils/constants.js';

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const traceId = (request.headers[TRACE_ID_HEADER] as string) ?? 'unknown';

    return next.handle().pipe(
      map((data) => ({
        success: true,
        message: 'OK',
        data: data ?? null,
        traceId,
      })),
    );
  }
}
