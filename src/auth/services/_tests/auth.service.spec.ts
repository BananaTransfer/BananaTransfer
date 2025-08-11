import { JwtService } from '@nestjs/jwt';

import { AuthService } from '@auth/services/auth.service';
import { UserService } from '@user/services/user.service';

import type { Mocked } from '@suites/doubles.jest';
import { TestBed } from '@suites/unit';
import { UnauthorizedException } from '@nestjs/common';
import { LocalUser } from '@database/entities/local-user.entity';
import { UserStatus } from '@database/entities/enums';
import { UserPayload } from '@auth/types/user-payload.interface';
import { PasswordService } from '@user/services/password.service';

describe('AuthService', () => {
  let authService: AuthService;
  let userService: Mocked<UserService>;
  let jwtService: Mocked<JwtService>;
  let passwordService: Mocked<PasswordService>;

  beforeEach(async () => {
    const { unit, unitRef } = await TestBed.solitary(AuthService).compile();
    authService = unit;
    userService = unitRef.get(UserService);
    jwtService = unitRef.get(JwtService);
    passwordService = unitRef.get(PasswordService);
  });

  describe('verifyJwt', () => {
    test('should forward the jwt token to the jwtService', async () => {
      // given
      const token = 'token';
      const expectedResult: UserPayload = { id: 1, username: 'test' };
      jwtService.verifyAsync.mockResolvedValue(expectedResult);

      // when
      const result: UserPayload = await authService.verifyJwt(token);

      // then
      expect(result).toEqual(expectedResult);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(token);
    });
  });

  describe('validateUser', () => {
    test('should throw an exception if no user found', async () => {
      // given
      userService.findByUsername.mockResolvedValue(null);

      // when + then
      await expect(authService.validateUser('any', 'user')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    test('should throw an exception if provided password is wrong', async () => {
      // given
      const localUser = new LocalUser();
      localUser.password_hash = 'someHash';
      userService.findByUsername.mockResolvedValue(localUser);

      passwordService.validatePassword.mockResolvedValue(false);

      // when + then
      await expect(
        authService.validateUser('any', 'password2'),
      ).rejects.toThrow(UnauthorizedException);
    });

    test('should throw an exception if selected user is not active', async () => {
      // given
      const localUser = new LocalUser();
      localUser.password_hash = 'someHash';
      localUser.status = UserStatus.DISABLED;
      userService.findByUsername.mockResolvedValue(localUser);
      passwordService.validatePassword.mockResolvedValue(true);

      // when + then
      await expect(authService.validateUser('any', 'password')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    test('should complete successfully in happy case', async () => {
      // given
      const localUser = new LocalUser();
      localUser.password_hash = 'someHash';
      localUser.status = UserStatus.ACTIVE;
      userService.findByUsername.mockResolvedValue(localUser);
      passwordService.validatePassword.mockResolvedValue(true);

      // when + then
      const user = await authService.validateUser('any', 'password');
      expect(user).toEqual(localUser);
      expect(passwordService.validatePassword).toHaveBeenCalledWith(
        localUser,
        'password',
      );
    });
  });

  describe('registerUser', () => {
    // throw user exist
    // throw email exist
    // else create
  });

  describe('authenticateUser', () => {
    // happy path
  });
});
