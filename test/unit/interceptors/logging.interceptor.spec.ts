import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { LoggingInterceptor } from '../../../src/cross-cutting/interceptors/logging.interceptor.js';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
  });

  it('should pass through the response', (done) => {
    const mockData = { id: 1, name: 'test' };
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'GET',
          url: '/test',
          headers: { 'x-request-id': 'trace-123' },
        }),
        getResponse: () => ({ statusCode: 200 }),
      }),
    } as unknown as ExecutionContext;

    const handler: CallHandler = { handle: () => of(mockData) };

    interceptor.intercept(context, handler).subscribe({
      next: (value) => {
        expect(value).toEqual(mockData);
        done();
      },
    });
  });
});
