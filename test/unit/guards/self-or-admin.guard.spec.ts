import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SelfOrAdminGuard } from '../../../src/cross-cutting/guards/self-or-admin.guard.js';

function createMockContext(userId: string, roles: string[], paramId: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        user: { sub: userId, roles },
        params: { id: paramId },
      }),
    }),
  } as unknown as ExecutionContext;
}

describe('SelfOrAdminGuard', () => {
  let guard: SelfOrAdminGuard;

  beforeEach(() => {
    guard = new SelfOrAdminGuard();
  });

  it('should allow admin to access any resource', () => {
    const context = createMockContext('admin-1', ['admin'], 'other-user');
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow user to access own resource', () => {
    const context = createMockContext('user-1', ['user'], 'user-1');
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny user access to another users resource', () => {
    const context = createMockContext('user-1', ['user'], 'user-2');
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should deny when user context is missing', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: undefined,
          params: { id: 'user-1' },
        }),
      }),
    } as unknown as ExecutionContext;
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
