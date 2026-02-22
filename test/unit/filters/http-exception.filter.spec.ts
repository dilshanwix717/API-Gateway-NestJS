import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from '../../../src/cross-cutting/filters/http-exception.filter.js';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
  });

  function createMockHost(): ArgumentsHost {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'GET',
          url: '/test',
          headers: { 'x-request-id': 'trace-123' },
        }),
        getResponse: () => ({
          status: mockStatus,
        }),
      }),
    } as unknown as ArgumentsHost;
  }

  it('should format HttpException as ApiResponse', () => {
    const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);
    filter.catch(exception, createMockHost());

    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      message: 'Not Found',
      data: null,
      traceId: 'trace-123',
    });
  });

  it('should handle unknown exceptions as 500', () => {
    const exception = new Error('Something broke');
    filter.catch(exception, createMockHost());

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      message: 'Something broke',
      data: null,
      traceId: 'trace-123',
    });
  });

  it('should handle non-Error exceptions', () => {
    filter.catch('string error', createMockHost());

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      message: 'Internal server error',
      data: null,
      traceId: 'trace-123',
    });
  });
});
