// import { JwtService } from '@nestjs/jwt';
//
// import { AuthService } from '@auth/services/auth.service';
// import { UserService } from '@user/services/user.service';
//
// import type { Mocked } from '@suites/doubles.jest';
// import { TestBed } from '@suites/unit';
// import { JwtPayload } from '@auth/interfaces/jwt-payload.interface';
// import { NotFoundException, UnauthorizedException } from '@nestjs/common';
// import { LocalUser } from '@database/entities/local-user.entity';
// import * as bcrypt from 'bcrypt';
// import { UserStatus } from '@database/entities/enums';
//
// describe('AuthService', () => {
//   let authService: AuthService;
//   let userService: Mocked<UserService>;
//   let jwtService: Mocked<JwtService>;
//
//   beforeEach(async () => {
//     const { unit, unitRef } = await TestBed.solitary(AuthService).compile();
//     authService = unit;
//     userService = unitRef.get(UserService);
//     jwtService = unitRef.get(JwtService);
//   });
//
//   describe('verifyJwt', () => {
//     test('should forward the jwt token to the jwtService', async () => {
//       // given
//       const token = 'token';
//       const expectedResult: JwtPayload = { username: 'test', sub: 1 };
//       jwtService.verifyAsync.mockResolvedValue(expectedResult);
//
//       // when
//       const result: JwtPayload = await authService.verifyJwt(token);
//
//       // then
//       expect(result).toEqual(expectedResult);
//       expect(jwtService.verifyAsync).toHaveBeenCalledWith(token);
//     });
//   });
//
//   describe('validateUser', () => {
//     test('should throw an exception if no user found', async () => {
//       // given
//       userService.getUserInfo.mockRejectedValue(new NotFoundException());
//
//       // when + then
//       await expect(authService.validateUser('any', 'user')).rejects.toThrow(
//         NotFoundException,
//       );
//     });
//
//     test('should throw an exception if provided password is wrong', async () => {
//       // given
//       const localUser = new LocalUser();
//       localUser.password_hash = await bcrypt.hash('password', 10);
//       userService.getUserInfo.mockResolvedValue(localUser);
//
//       // when + then
//       await expect(
//         authService.validateUser('any', 'password2'),
//       ).rejects.toThrow(UnauthorizedException);
//     });
//
//     test('should throw an exception if selected user is not active', async () => {
//       // given
//       const localUser = new LocalUser();
//       localUser.password_hash = await bcrypt.hash('password', 10);
//       localUser.status = UserStatus.DISABLED;
//       userService.getUserInfo.mockResolvedValue(localUser);
//
//       // when + then
//       await expect(authService.validateUser('any', 'password')).rejects.toThrow(
//         UnauthorizedException,
//       );
//     });
//
//     test('should complete successfully in happy case', async () => {
//       // given
//       const localUser = new LocalUser();
//       localUser.password_hash = await bcrypt.hash('password', 10);
//       localUser.status = UserStatus.ACTIVE;
//       userService.getUserInfo.mockResolvedValue(localUser);
//
//       // when + then
//       const user = await authService.validateUser('any', 'password');
//       expect(user).toEqual(localUser);
//     });
//   });
//
//   describe('registerUser', () => {
//     // throw user exist
//     // throw email exist
//     // else create
//   });
//
//   describe('authenticateUser', () => {
//     // happy path
//   });
// });

test('tmp', () => {});
