import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthenticatedRequest } from '../../interfaces/request.interface.js';
import { ROLES } from '../../utils/constants.js';

@Injectable()
export class RoleThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, string>): Promise<string> {
    // uses IP address as the unique identifier.
    //(You could also use userId for authenticated users.)
    return Promise.resolve(req['ip'] ?? 'unknown');
  }
  //Determines whether rate limiting should be skipped.
  protected shouldSkip(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    // Skip rate limiting for admins (relaxed)
    if (user?.roles?.includes(ROLES.ADMIN)) {
      return Promise.resolve(true);
    }

    return Promise.resolve(false);
  }
}
