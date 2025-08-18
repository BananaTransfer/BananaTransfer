import { UserStatusGuard } from '@transfer/guards/userStatus.guard';
import { TestBed } from '@suites/unit';
import { Mocked } from '@suites/doubles.jest';
import { UserService } from '@user/services/user.service';
import { LocalUser } from '@database/entities/local-user.entity';
import { ExecutionContext } from '@nestjs/common';

describe('UserStatusGuard', () => {
  let guard: UserStatusGuard;
  let userService: Mocked<UserService>;

  // mock response with redirect
  let redirectMock: jest.Mock;
  let context: ExecutionContext;

  beforeEach(async () => {
    const { unit, unitRef } = await TestBed.solitary(UserStatusGuard).compile();
    guard = unit;
    userService = unitRef.get(UserService);

    redirectMock = jest.fn();

    // mock ExecutionContext with request.user + response
    context = {
      switchToHttp: () => ({
        getRequest: () => ({ user: { id: 123 } }),
        getResponse: () => ({ redirect: redirectMock }),
      }),
    } as unknown as ExecutionContext;
  });

  it('should redirect user if it has not private key set', async () => {
    userService.getCurrentUser.mockResolvedValue({
      private_key_encrypted: null,
    } as unknown as LocalUser);

    const result = await guard.canActivate(context);

    expect(userService.getCurrentUser).toHaveBeenCalledWith(123);
    expect(redirectMock).toHaveBeenCalledWith('/user/set-keys');
    expect(result).toBe(false);
  });

  it('should not redirect user if it has a private key set', async () => {
    userService.getCurrentUser.mockResolvedValue({
      private_key_encrypted: 'encrypted-key',
    } as LocalUser);

    const result = await guard.canActivate(context);

    expect(userService.getCurrentUser).toHaveBeenCalledWith(123);
    expect(redirectMock).not.toHaveBeenCalled();
    expect(result).toBe(true);
  });
});
