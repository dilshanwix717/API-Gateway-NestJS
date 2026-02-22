import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthenticatedRequest } from '../../interfaces/request.interface.js';
import { ROLES } from '../../utils/constants.js';

@Injectable()
export class SelfOrAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    const paramId = request.params['id'];

    if (!user) {
      throw new ForbiddenException('User context not found');
    }

    const isAdmin = user.roles?.includes(ROLES.ADMIN);
    const isSelf = user.sub === paramId;

    if (!isAdmin && !isSelf) {
      throw new ForbiddenException('You can only access your own resources');
    }

    return true;
  }
}
