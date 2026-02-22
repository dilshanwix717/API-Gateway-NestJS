import { Request, Response } from 'express';
import { TraceIdMiddleware } from '../../../src/cross-cutting/middlewares/trace-id.middleware.js';

describe('TraceIdMiddleware', () => {
  let middleware: TraceIdMiddleware;

  beforeEach(() => {
    middleware = new TraceIdMiddleware();
  });

  it('should generate a trace ID when none exists', () => {
    const req = { headers: {} } as Request;
    const res = {} as Response;
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(req.headers['x-request-id']).toBeDefined();
    expect(typeof req.headers['x-request-id']).toBe('string');
    expect((req.headers['x-request-id'] as string).length).toBeGreaterThan(0);
    expect(next).toHaveBeenCalled();
  });

  it('should preserve existing trace ID', () => {
    const req = { headers: { 'x-request-id': 'existing-trace-id' } } as unknown as Request;
    const res = {} as Response;
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(req.headers['x-request-id']).toBe('existing-trace-id');
    expect(next).toHaveBeenCalled();
  });
});
