import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { TRACE_ID_HEADER } from '../../utils/constants.js';

@Injectable()
export class TraceIdMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const existingTraceId = req.headers[TRACE_ID_HEADER] as string | undefined;
    const traceId = existingTraceId ?? uuidv4();

    req.headers[TRACE_ID_HEADER] = traceId;
    (req as unknown as Record<string, unknown>)['traceId'] = traceId;

    next();
  }
}
