import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { ResponseTransformInterceptor } from '../../../src/cross-cutting/interceptors/response-transform.interceptor.js';

describe('ResponseTransformInterceptor', () => {
  let interceptor: ResponseTransformInterceptor<unknown>;

  beforeEach(() => {
    interceptor = new ResponseTransformInterceptor();
  });

  it('should wrap response in ApiResponse format', (done) => {
    const mockData = { id: 1, name: 'test' };
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { 'x-request-id': 'trace-123' },
        }),
      }),
    } as unknown as ExecutionContext;

    const handler: CallHandler = { handle: () => of(mockData) };

    interceptor.intercept(context, handler).subscribe({
      next: (value) => {
        expect(value).toEqual({
          success: true,
          message: 'OK',
          data: mockData,
          traceId: 'trace-123',
        });
        done();
      },
    });
  });

  it('should handle null data', (done) => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { 'x-request-id': 'trace-456' },
        }),
      }),
    } as unknown as ExecutionContext;

    const handler: CallHandler = { handle: () => of(null) };

    interceptor.intercept(context, handler).subscribe({
      next: (value) => {
        expect(value).toEqual({
          success: true,
          message: 'OK',
          data: null,
          traceId: 'trace-456',
        });
        done();
      },
    });
  });
});
