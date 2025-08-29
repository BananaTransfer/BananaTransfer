import { UserStatusGuard } from '@transfer/guards/userStatus.guard';
import { TestBed } from '@suites/unit';
import { ExecutionContext } from '@nestjs/common';

describe('UserStatusGuard', () => {
  let guard: UserStatusGuard;

  // mock response with redirect
  let redirectMock: jest.Mock;
  let context: ExecutionContext;

  beforeEach(async () => {
    const { unit } = await TestBed.solitary(UserStatusGuard).compile();
    guard = unit;

    redirectMock = jest.fn();

    // mock ExecutionContext with request.user + response
    context = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: 123 },
          cookies: { noKeysSet: 'true' },
        }),
        getResponse: () => ({ redirect: redirectMock }),
      }),
    } as unknown as ExecutionContext;
  });

  it('should redirect user if they have hasKeysSet false', () => {
    const result = guard.canActivate(context);

    expect(redirectMock).toHaveBeenCalledWith('/user/set-keys');
    expect(result).toBe(false);
  });

  it('should not redirect user if they have hasKeysSet true', () => {
    context = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: 123 },
          cookies: {},
        }),
        getResponse: () => ({ redirect: redirectMock }),
      }),
    } as unknown as ExecutionContext;

    const result = guard.canActivate(context);

    expect(redirectMock).not.toHaveBeenCalled();
    expect(result).toBe(true);
  });
});
