import { ExecutionContext } from '@nestjs/common';
import { AuthenticatedGuard } from './authenticated.guard';

describe('AuthenticatedGuard', () => {
  let guard: AuthenticatedGuard;

  beforeEach(() => {
    guard = new AuthenticatedGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return true if the user is authenticated', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ isAuthenticated: () => true }),
      }),
    } as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should return false if the user is not authenticated', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ isAuthenticated: () => false }),
      }),
    } as ExecutionContext;

    expect(guard.canActivate(context)).toBe(false);
  });
});
